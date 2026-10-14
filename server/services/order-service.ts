import { prisma, TX_CONFIG } from "@/lib/db";
import { OrderStatus, ItemStatus, OrderType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderParams {
  type: OrderType;
  tableId?: string | null;
  notes?: string | null;
  createdById: string;
  items: CreateOrderItemInput[];
  submitImmediately?: boolean;
}

/**
 * Creates an order, snapshotting menu item prices and calculating authoritative server-side totals.
 */
export async function createOrderService(params: CreateOrderParams) {
  const { type, tableId, notes, createdById, items, submitImmediately = true } = params;

  // 1. Validate items array
  if (!items || items.length === 0) {
    throw new Error("Cannot create an order without line items");
  }

  // 2. Dine-in checks
  if (type === OrderType.DINE_IN) {
    if (!tableId) {
      throw new Error("Table selection is required for Dine-in orders");
    }
    const table = await prisma.diningTable.findUnique({ where: { id: tableId } });
    if (!table || !table.isActive) {
      throw new Error("Selected dining table does not exist or is inactive");
    }
  }

  // 3. Fetch menu items to get authoritative server-side prices
  const menuItemIds = items.map((i) => i.menuItemId);
  const dbMenuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  });

  const menuItemMap = new Map(dbMenuItems.map((m) => [m.id, m]));

  for (const item of items) {
    const dbItem = menuItemMap.get(item.menuItemId);
    if (!dbItem) {
      throw new Error(`Menu item ID ${item.menuItemId} was not found in the database`);
    }
    if (!dbItem.isAvailable) {
      throw new Error(`"${dbItem.name}" is currently marked unavailable`);
    }
  }

  // 4. Compute authoritative financial totals
  let subtotal = new Decimal(0);
  const orderItemsData = items.map((item) => {
    const dbItem = menuItemMap.get(item.menuItemId)!;
    const unitPrice = new Decimal(dbItem.price);
    const lineTotal = unitPrice.mul(item.quantity);
    subtotal = subtotal.add(lineTotal);

    return {
      menuItemId: dbItem.id,
      nameSnapshot: dbItem.name,
      unitPrice,
      quantity: item.quantity,
      notes: item.notes || null,
      status: ItemStatus.QUEUED,
    };
  });

  // 5% GST tax calculation for demo restaurant policy
  const taxRate = new Decimal(0.05);
  const taxAmount = subtotal.mul(taxRate).toDecimalPlaces(2);
  const discountAmount = new Decimal(0);
  const serviceCharge = new Decimal(0);
  const total = subtotal.sub(discountAmount).add(taxAmount).add(serviceCharge).toDecimalPlaces(2);

  const initialStatus = submitImmediately ? OrderStatus.SENT_TO_KITCHEN : OrderStatus.DRAFT;
  const sentAt = submitImmediately ? new Date() : null;

  // 5. Execute creation inside an atomic transaction
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        type,
        tableId: type === OrderType.DINE_IN ? tableId : null,
        createdById,
        notes: notes || null,
        status: initialStatus,
        subtotal,
        discountAmount,
        taxAmount,
        serviceCharge,
        total,
        sentAt,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        createdBy: { select: { id: true, name: true, role: true } },
        items: { include: { menuItem: true } },
      },
    });

    return order;
  }, TX_CONFIG);
}

/**
 * Updates an individual order item's status and evaluates parent order state transitions.
 */
export async function updateOrderItemStatusService(orderItemId: string, newStatus: ItemStatus) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find item and verify parent order
    const item = await tx.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: { include: { items: true } } },
    });

    if (!item) {
      throw new Error("Order item not found");
    }

    if (item.order.status === OrderStatus.PAID || item.order.status === OrderStatus.CANCELLED) {
      throw new Error(`Cannot modify items for an order in ${item.order.status} state`);
    }

    // 2. Update item status
    await tx.orderItem.update({
      where: { id: orderItemId },
      data: { status: newStatus },
    });

    // 3. Evaluate state of all items for parent order
    const updatedItems = await tx.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const nonCancelledItems = updatedItems.filter((i) => i.status !== ItemStatus.CANCELLED);
    const anyPreparing = nonCancelledItems.some((i) => i.status === ItemStatus.PREPARING);
    const allReady = nonCancelledItems.length > 0 && nonCancelledItems.every((i) => i.status === ItemStatus.READY);

    let nextOrderStatus = item.order.status;
    let readyAt = item.order.readyAt;

    if (allReady) {
      nextOrderStatus = OrderStatus.READY;
      if (!readyAt) readyAt = new Date();
    } else if (anyPreparing && item.order.status === OrderStatus.SENT_TO_KITCHEN) {
      nextOrderStatus = OrderStatus.PREPARING;
    }

    if (nextOrderStatus !== item.order.status) {
      await tx.order.update({
        where: { id: item.orderId },
        data: {
          status: nextOrderStatus,
          readyAt,
        },
      });
    }

    return {
      orderId: item.orderId,
      orderItemId,
      newStatus,
      parentOrderStatus: nextOrderStatus,
    };
  }, TX_CONFIG);
}

/**
 * Captain marks a ready order as SERVED.
 */
export async function markOrderServedService(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  if (order.status !== OrderStatus.READY) {
    throw new Error(`Only READY orders can be marked served. Current status is ${order.status}`);
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.SERVED },
  });
}

/**
 * Captain requests bill for a served order.
 */
export async function requestBillService(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  // In dine-in, order should be SERVED or READY (or Takeaway)
  const allowedStatuses: OrderStatus[] = [OrderStatus.SERVED, OrderStatus.READY];
  if (!allowedStatuses.includes(order.status) && order.type !== OrderType.TAKEAWAY) {
    throw new Error(`Cannot request bill while order is in ${order.status} state. Order must be served.`);
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.BILL_REQUESTED,
      billRequestedAt: new Date(),
    },
  });
}

/**
 * Cancels an active order with documented reason in AuditLog.
 */
export async function cancelOrderService(orderId: string, actorId: string, reason: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    if (order.status === OrderStatus.PAID) {
      throw new Error("Cannot cancel an already PAID order. Use Admin void workflow instead.");
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    // Mark items cancelled
    await tx.orderItem.updateMany({
      where: { orderId },
      data: { status: ItemStatus.CANCELLED },
    });

    // Audit log entry
    await tx.auditLog.create({
      data: {
        actorId,
        action: "ORDER_CANCELLED",
        entityType: "Order",
        entityId: orderId,
        reason,
        metadata: { previousStatus: order.status, total: order.total.toString() },
      },
    });

    return updated;
  }, TX_CONFIG);
}

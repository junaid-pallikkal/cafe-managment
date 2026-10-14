import { prisma, TX_CONFIG } from "@/lib/db";
import { OrderStatus, PaymentMethod } from "@prisma/client";

export interface RecordPaymentParams {
  orderId: string;
  cashierId: string;
  method: PaymentMethod;
  amountTendered?: number;
  reference?: string | null;
}

/**
 * Executes atomic payment settlement inside a single database transaction.
 * Prevents race conditions, double payments, and enforces financial immutability.
 */
export async function recordPaymentService(params: RecordPaymentParams) {
  const { orderId, cashierId, method, reference } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch fresh authoritative order state
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        items: true,
        table: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // 2. Prevent settling already paid order
    if (order.status === OrderStatus.PAID || order.paidAt !== null) {
      throw new Error(`Order #${order.orderNumber} is already marked PAID. Concurrent payment prevented.`);
    }

    // 3. Ensure no existing payment record exists for this order (Single full payment MVP policy)
    if (order.payments.length > 0) {
      throw new Error(`A payment record already exists for Order #${order.orderNumber}.`);
    }

    // 4. Verify valid billing state
    const allowedStates: OrderStatus[] = [OrderStatus.BILL_REQUESTED, OrderStatus.SERVED, OrderStatus.READY];
    if (!allowedStates.includes(order.status) && order.type !== "TAKEAWAY") {
      throw new Error(`Order must be in BILL_REQUESTED state before checkout. Current state: ${order.status}`);
    }

    // 5. Generate formatted unique receipt number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const receiptNo = `REC-${datePrefix}-${order.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Create authoritative payment record
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        cashierId,
        receiptNo,
        amount: order.total,
        method,
        reference: reference || null,
      },
    });

    // 7. Transition order to PAID atomically
    const paidAt = new Date();
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt,
      },
      include: {
        table: true,
        createdBy: { select: { name: true, email: true } },
        items: true,
      },
    });

    // 8. Record audit log entry
    await tx.auditLog.create({
      data: {
        actorId: cashierId,
        action: "ORDER_PAYMENT_SETTLED",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          receiptNo,
          amount: order.total.toString(),
          method,
          orderNumber: order.orderNumber,
        },
      },
    });

    return {
      order: updatedOrder,
      payment,
    };
  }, TX_CONFIG);
}

/**
 * Fetches authoritative bill details for an order.
 */
export async function getBillDetailService(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      createdBy: { select: { id: true, name: true, role: true } },
      items: true,
      payments: {
        include: {
          cashier: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");
  return order;
}

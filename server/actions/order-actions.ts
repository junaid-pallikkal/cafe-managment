"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { ActionResult } from "@/lib/permissions";
import { CreateOrderSchema, UpdateItemStatusSchema } from "@/lib/validations/schemas";
import {
  createOrderService,
  updateOrderItemStatusService,
  markOrderServedService,
  requestBillService,
  cancelOrderService,
} from "@/server/services/order-service";
import { revalidatePath } from "next/cache";

export async function createOrderAction(
  data: unknown
): Promise<ActionResult<{ orderId: string; orderNumber: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (!["CAPTAIN", "BILLING", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Unauthorized: only Captain, Billing, or Admin can create orders" };
    }

    const parsed = CreateOrderSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const order = await createOrderService({
      type: parsed.data.type,
      tableId: parsed.data.tableId,
      notes: parsed.data.notes,
      createdById: user.id,
      items: parsed.data.items,
      submitImmediately: true,
    });

    revalidatePath("/captain");
    revalidatePath("/kitchen");
    revalidatePath("/billing");
    revalidatePath("/admin");

    return {
      success: true,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return { success: false, error: message };
  }
}

export async function updateOrderItemStatusAction(
  data: unknown
): Promise<ActionResult<{ orderItemId: string; newStatus: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (!["KITCHEN", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Unauthorized: only Kitchen staff or Admin can update preparation status" };
    }

    const parsed = UpdateItemStatusSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid status payload" };
    }

    const result = await updateOrderItemStatusService(parsed.data.orderItemId, parsed.data.status);

    revalidatePath("/kitchen");
    revalidatePath("/captain");

    return {
      success: true,
      data: { orderItemId: result.orderItemId, newStatus: result.newStatus },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update item status";
    return { success: false, error: message };
  }
}

export async function markOrderServedAction(orderId: string): Promise<ActionResult<{ orderId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (!["CAPTAIN", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Unauthorized: only Captains can mark food served" };
    }

    await markOrderServedService(orderId);

    revalidatePath("/captain");
    revalidatePath("/kitchen");

    return { success: true, data: { orderId } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark order served";
    return { success: false, error: message };
  }
}

export async function requestBillAction(orderId: string): Promise<ActionResult<{ orderId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (!["CAPTAIN", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Unauthorized: only Captains can request billing" };
    }

    await requestBillService(orderId);

    revalidatePath("/captain");
    revalidatePath("/billing");

    return { success: true, data: { orderId } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to request bill";
    return { success: false, error: message };
  }
}

export async function cancelOrderAction(orderId: string, reason: string): Promise<ActionResult<{ orderId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (!["ADMIN", "CAPTAIN"].includes(user.role)) {
      return { success: false, error: "Unauthorized to cancel order" };
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "A valid cancellation reason is required" };
    }

    await cancelOrderService(orderId, user.id, reason);

    revalidatePath("/captain");
    revalidatePath("/kitchen");
    revalidatePath("/billing");
    revalidatePath("/admin");

    return { success: true, data: { orderId } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel order";
    return { success: false, error: message };
  }
}

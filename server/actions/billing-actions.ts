"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { ActionResult } from "@/lib/permissions";
import { RecordPaymentSchema } from "@/lib/validations/schemas";
import { recordPaymentService } from "@/server/services/billing-service";
import { revalidatePath } from "next/cache";

export async function recordPaymentAction(
  data: unknown
): Promise<ActionResult<{ paymentId: string; receiptNo: string; orderNumber: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (!["BILLING", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Unauthorized: only Billing Cashiers or Admin can record payments" };
    }

    const parsed = RecordPaymentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { order, payment } = await recordPaymentService({
      orderId: parsed.data.orderId,
      cashierId: user.id,
      method: parsed.data.method,
      amountTendered: parsed.data.amountTendered,
      reference: parsed.data.reference,
    });

    revalidatePath("/billing");
    revalidatePath("/captain");
    revalidatePath("/admin");

    return {
      success: true,
      data: {
        paymentId: payment.id,
        receiptNo: payment.receiptNo,
        orderNumber: order.orderNumber,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record payment";
    return { success: false, error: message };
  }
}

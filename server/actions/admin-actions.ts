"use server";

import { getCurrentUser, hashPassword } from "@/lib/auth/session";
import { ActionResult } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  CreatePurchaseSchema,
  CreateExpenseSchema,
  MenuItemSchema,
  StaffUserSchema,
} from "@/lib/validations/schemas";
import { createPurchaseService } from "@/server/services/purchase-service";
import { createExpenseService } from "@/server/services/expense-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TableSchema = z.object({
  label: z.string().min(1, "Table label is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
});

export async function createPurchaseAction(data: unknown): Promise<ActionResult<{ purchaseId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: only Admin can record purchases" };
    }

    const parsed = CreatePurchaseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const purchase = await createPurchaseService({
      ...parsed.data,
      createdById: user.id,
    });

    revalidatePath("/admin/purchases");
    revalidatePath("/admin");

    return { success: true, data: { purchaseId: purchase.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record purchase";
    return { success: false, error: message };
  }
}

export async function createExpenseAction(data: unknown): Promise<ActionResult<{ expenseId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: only Admin can record operating expenses" };
    }

    const parsed = CreateExpenseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const expense = await createExpenseService({
      ...parsed.data,
      createdById: user.id,
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin");

    return { success: true, data: { expenseId: expense.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record expense";
    return { success: false, error: message };
  }
}

export async function createMenuItemAction(data: unknown): Promise<ActionResult<{ itemId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: only Admin can modify menu" };
    }

    const parsed = MenuItemSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const item = await prisma.menuItem.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        categoryId: parsed.data.categoryId,
        isAvailable: parsed.data.isAvailable,
      },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/captain/orders/new");

    return { success: true, data: { itemId: item.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create menu item";
    return { success: false, error: message };
  }
}

export async function toggleMenuItemAvailabilityAction(
  itemId: string,
  isAvailable: boolean
): Promise<ActionResult<{ itemId: string; isAvailable: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: only Admin can toggle item availability" };
    }

    await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/captain/orders/new");

    return { success: true, data: { itemId, isAvailable } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle availability";
    return { success: false, error: message };
  }
}

export async function createTableAction(data: unknown): Promise<ActionResult<{ tableId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: only Admin can manage tables" };
    }

    const parsed = TableSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const table = await prisma.diningTable.create({
      data: {
        label: parsed.data.label,
        capacity: parsed.data.capacity,
      },
    });

    revalidatePath("/admin/tables");
    revalidatePath("/captain");

    return { success: true, data: { tableId: table.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create table";
    return { success: false, error: message };
  }
}

export async function createStaffUserAction(data: unknown): Promise<ActionResult<{ userId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: only Admin can manage staff" };
    }

    const parsed = StaffUserSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const newUser = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        isActive: true,
      },
    });

    revalidatePath("/admin/staff");

    return { success: true, data: { userId: newUser.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create staff account";
    return { success: false, error: message };
  }
}

export async function toggleUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<ActionResult<{ userId: string; isActive: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: only Admin can deactivate staff" };
    }

    if (user.id === userId) {
      return { success: false, error: "You cannot deactivate your own account" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    revalidatePath("/admin/staff");

    return { success: true, data: { userId, isActive } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle account status";
    return { success: false, error: message };
  }
}

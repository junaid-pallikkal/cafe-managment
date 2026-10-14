import { prisma } from "@/lib/db";
import { PaymentMethod, Prisma } from "@prisma/client";

export interface CreateExpenseInput {
  category: string;
  description: string;
  amount: number;
  method?: PaymentMethod | null;
  payee?: string | null;
  notes?: string | null;
  createdById: string;
}

export async function createExpenseService(data: CreateExpenseInput) {
  const expense = await prisma.expense.create({
    data: {
      category: data.category,
      description: data.description,
      amount: new Prisma.Decimal(data.amount),
      method: data.method || null,
      payee: data.payee || null,
      notes: data.notes || null,
      createdById: data.createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.createdById,
      action: "EXPENSE_RECORDED",
      entityType: "Expense",
      entityId: expense.id,
      metadata: {
        category: data.category,
        description: data.description,
        amount: data.amount,
      },
    },
  });

  return expense;
}

export async function getExpensesService(limit = 50) {
  return await prisma.expense.findMany({
    take: limit,
    orderBy: { spentAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

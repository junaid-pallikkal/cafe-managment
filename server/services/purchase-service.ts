import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface CreatePurchaseInput {
  description: string;
  supplier?: string | null;
  reference?: string | null;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  amount: number;
  notes?: string | null;
  createdById: string;
}

export async function createPurchaseService(data: CreatePurchaseInput) {
  const purchase = await prisma.purchase.create({
    data: {
      description: data.description,
      supplier: data.supplier || null,
      reference: data.reference || null,
      category: data.category,
      quantity: data.quantity ? new Prisma.Decimal(data.quantity) : null,
      unit: data.unit || null,
      amount: new Prisma.Decimal(data.amount),
      createdById: data.createdById,
      notes: data.notes || null,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: data.createdById,
      action: "PURCHASE_RECORDED",
      entityType: "Purchase",
      entityId: purchase.id,
      metadata: {
        description: data.description,
        amount: data.amount,
        supplier: data.supplier,
      },
    },
  });

  return purchase;
}

export async function getPurchasesService(limit = 50) {
  return await prisma.purchase.findMany({
    take: limit,
    orderBy: { purchasedAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

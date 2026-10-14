import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PurchaseManager, PurchaseWithActor } from "@/components/admin/purchase-manager";
import { serializeForClient } from "@/lib/utils";

export default async function AdminPurchasesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const purchases = (await prisma.purchase.findMany({
    orderBy: { purchasedAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  })) as PurchaseWithActor[];

  return <PurchaseManager purchases={serializeForClient(purchases)} />;
}

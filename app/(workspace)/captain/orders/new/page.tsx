import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OrderCreator } from "@/components/orders/order-creator";
import { serializeForClient } from "@/lib/utils";

interface NewOrderPageProps {
  searchParams: Promise<{ tableId?: string; type?: string }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Next.js 16 breaking change: searchParams must be awaited
  const resolvedSearchParams = await searchParams;
  const initialTableId = resolvedSearchParams.tableId || null;
  const initialType = (resolvedSearchParams.type as "DINE_IN" | "TAKEAWAY") || "DINE_IN";

  // Fetch available dining tables
  const tables = await prisma.diningTable.findMany({
    where: { isActive: true },
    orderBy: { label: "asc" },
  });

  // Fetch menu categories with active items
  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { name: "asc" },
      },
    },
  });

  return (
    <OrderCreator
      tables={serializeForClient(tables)}
      categories={serializeForClient(categories)}
      initialTableId={initialTableId}
      initialType={initialType}
    />
  );
}

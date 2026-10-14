import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OrderCreator } from "@/components/orders/order-creator";
import { serializeForClient } from "@/lib/utils";

export default async function FastTakeawayBillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch tables and menu categories
  const tables = await prisma.diningTable.findMany({
    where: { isActive: true },
    orderBy: { label: "asc" },
  });

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
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/25 p-3 rounded-xl text-xs text-primary flex items-center justify-between">
        <span>
          <strong>Fast Takeaway Counter:</strong> Create a takeaway order and send directly to kitchen. You can settle payment immediately or when the customer picks up.
        </span>
      </div>
      <OrderCreator
        tables={serializeForClient(tables)}
        categories={serializeForClient(categories)}
        initialType="TAKEAWAY"
      />
    </div>
  );
}

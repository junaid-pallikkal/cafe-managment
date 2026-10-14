import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { TableManager, TableWithOrders } from "@/components/admin/table-manager";
import { serializeForClient } from "@/lib/utils";

export default async function AdminTablesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const tables = (await prisma.diningTable.findMany({
    where: { isActive: true },
    orderBy: { label: "asc" },
    include: {
      orders: {
        where: {
          status: {
            notIn: ["PAID", "CANCELLED"],
          },
        },
      },
    },
  })) as TableWithOrders[];

  return <TableManager tables={serializeForClient(tables)} />;
}

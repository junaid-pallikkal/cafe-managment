import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ExpenseManager, ExpenseWithActor } from "@/components/admin/expense-manager";
import { serializeForClient } from "@/lib/utils";

export default async function AdminExpensesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const expenses = (await prisma.expense.findMany({
    orderBy: { spentAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  })) as ExpenseWithActor[];

  return <ExpenseManager expenses={serializeForClient(expenses)} />;
}

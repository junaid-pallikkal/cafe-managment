import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { BillCheckout, BillOrder } from "@/components/billing/bill-checkout";
import { serializeForClient } from "@/lib/utils";

interface BillPageProps {
  params: Promise<{ id: string }>;
}

export default async function BillDetailPage({ params }: BillPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  const order = (await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      createdBy: { select: { id: true, name: true, role: true } },
      items: {
        orderBy: { createdAt: "asc" },
      },
      payments: {
        include: {
          cashier: { select: { id: true, name: true } },
        },
      },
    },
  })) as BillOrder | null;

  if (!order) {
    notFound();
  }

  return <BillCheckout order={serializeForClient(order)} cashierName={user.name} />;
}

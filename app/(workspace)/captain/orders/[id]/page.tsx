import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { serializeForClient } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      createdBy: { select: { id: true, name: true, role: true } },
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return <OrderDetailView order={serializeForClient(order)} userRole={user.role} />;
}

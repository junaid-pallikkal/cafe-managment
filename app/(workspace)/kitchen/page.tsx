import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { KitchenQueue, KitchenOrder } from "@/components/kitchen/kitchen-queue";
import { serializeForClient } from "@/lib/utils";

export default async function KitchenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Query active kitchen tickets: oldest ticket at top
  const activeOrders = (await prisma.order.findMany({
    where: {
      status: {
        in: ["SENT_TO_KITCHEN", "PREPARING", "READY"],
      },
    },
    include: {
      table: true,
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      sentAt: "asc",
    },
  })) as KitchenOrder[];

  return <KitchenQueue orders={serializeForClient(activeOrders)} />;
}

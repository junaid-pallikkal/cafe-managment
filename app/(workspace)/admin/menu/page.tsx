import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MenuManager, CategoryWithItems } from "@/components/admin/menu-manager";
import { serializeForClient } from "@/lib/utils";

export default async function AdminMenuPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const categories = (await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { name: "asc" },
      },
    },
  })) as CategoryWithItems[];

  return <MenuManager categories={serializeForClient(categories)} />;
}

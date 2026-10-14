import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { StaffManager, SafeStaffUser } from "@/components/admin/staff-manager";
import { serializeForClient } from "@/lib/utils";

export default async function AdminStaffPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const staffUsers = (await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  })) as SafeStaffUser[];

  return <StaffManager staffUsers={serializeForClient(staffUsers)} currentUserId={user.id} />;
}

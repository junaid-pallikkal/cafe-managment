import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { RoleNav } from "@/components/layout/role-nav";

export const metadata = {
  title: "Emerald Restaurant Operations",
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20">
      <AppHeader user={user} />
      <RoleNav role={user.role} />
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

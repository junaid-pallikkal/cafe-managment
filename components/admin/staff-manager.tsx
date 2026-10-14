"use client";

import React, { useState, useTransition } from "react";
import { User, Role } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createStaffUserAction, toggleUserActiveAction } from "@/server/actions/admin-actions";
import { formatDateTime } from "@/lib/formatters/date";
import {
  Users,
  PlusCircle,
  Shield,
  ChefHat,
  ConciergeBell,
  Receipt,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";

export type SafeStaffUser = Omit<User, "passwordHash">;

interface StaffManagerProps {
  staffUsers: SafeStaffUser[];
  currentUserId: string;
}

export function StaffManager({ staffUsers, currentUserId }: StaffManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.CAPTAIN);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await createStaffUserAction({
        name,
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (res.success) {
        setModalOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleUserActiveAction(userId, !currentActive);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const getRoleIcon = (userRole: Role) => {
    switch (userRole) {
      case "ADMIN":
        return <Shield className="h-3.5 w-3.5 text-chart-5" />;
      case "CAPTAIN":
        return <ConciergeBell className="h-3.5 w-3.5 text-primary" />;
      case "KITCHEN":
        return <ChefHat className="h-3.5 w-3.5 text-chart-3" />;
      case "BILLING":
        return <Receipt className="h-3.5 w-3.5 text-chart-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Staff Accounts & Role-Based Access Control</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create employee accounts, assign workstation roles, and deactivate accounts.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 h-9"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 pl-4">Staff Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Role</th>
                <th className="p-3">Account Status</th>
                <th className="p-3">Registered On</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {staffUsers.map((member) => {
                const isSelf = member.id === currentUserId;
                return (
                  <tr key={member.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-foreground flex items-center gap-2">
                      <span>{member.name}</span>
                      {isSelf && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                          You
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground font-mono">{member.email}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-muted border border-border">
                        {getRoleIcon(member.role)}
                        <span>{member.role}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          member.isActive
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "bg-destructive/10 text-destructive border border-destructive/30"
                        }`}
                      >
                        {member.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-destructive" />
                            <span>Deactivated</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(member.createdAt)}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      {!isSelf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(member.id, member.isActive)}
                          disabled={isPending}
                          className={`h-7 text-xs px-2.5 gap-1 ${
                            member.isActive
                              ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                              : "text-primary hover:bg-primary/10 border-primary/30"
                          }`}
                        >
                          {member.isActive ? (
                            <>
                              <UserX className="h-3.5 w-3.5" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Activate</span>
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Register a staff user and designate their authorized restaurant role.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateStaff} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Full Name *</label>
            <Input
              required
              placeholder="e.g. David Captain"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Email Address *</label>
            <Input
              required
              type="email"
              placeholder="e.g. david@restaurant.demo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">System Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full h-10 px-3 rounded-lg border border-border/80 bg-card text-xs text-foreground"
              >
                <option value="CAPTAIN">Captain (Floor Orders)</option>
                <option value="KITCHEN">Kitchen (Food Prep Display)</option>
                <option value="BILLING">Billing (Cashier & Settle)</option>
                <option value="ADMIN">Admin (Full Oversight)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Password *</label>
              <Input
                required
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPending ? "Creating..." : "Save Staff Account"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

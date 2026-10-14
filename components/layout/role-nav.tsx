"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Grid,
  PlusCircle,
  ChefHat,
  Receipt,
  ShoppingBag,
  LayoutDashboard,
  Utensils,
  Layers,
  Truck,
  CreditCard,
  BarChart3,
  Users,
} from "lucide-react";

interface RoleNavProps {
  role: Role;
}

export function RoleNav({ role }: RoleNavProps) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case "CAPTAIN":
        return [
          { href: "/captain", label: "Tables Floor", icon: Grid },
          { href: "/captain/orders/new", label: "Take Order", icon: PlusCircle },
        ];
      case "KITCHEN":
        return [
          { href: "/kitchen", label: "Live Queue (KDS)", icon: ChefHat },
        ];
      case "BILLING":
        return [
          { href: "/billing", label: "Pending Bills", icon: Receipt },
          { href: "/billing/takeaway", label: "Fast Takeaway", icon: ShoppingBag },
        ];
      case "ADMIN":
        return [
          { href: "/admin", label: "Overview", icon: LayoutDashboard },
          { href: "/admin/menu", label: "Menu Catalog", icon: Utensils },
          { href: "/admin/tables", label: "Tables", icon: Layers },
          { href: "/admin/purchases", label: "Purchases", icon: Truck },
          { href: "/admin/expenses", label: "Expenses", icon: CreditCard },
          { href: "/admin/reports", label: "Sales Reports", icon: BarChart3 },
          { href: "/admin/staff", label: "Staff", icon: Users },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <nav className="border-b border-border/70 bg-muted/40 px-4 sm:px-6 py-1.5 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 min-w-max">
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-card text-foreground shadow-xs border border-border/80 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Quick Switcher */}
        {role === "ADMIN" && (
          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-border/60 text-[11px] text-muted-foreground">
            <span>Views:</span>
            <Link
              href="/captain"
              className="px-2 py-0.5 rounded-md hover:bg-card text-muted-foreground hover:text-primary transition-colors"
            >
              Captain
            </Link>
            <Link
              href="/kitchen"
              className="px-2 py-0.5 rounded-md hover:bg-card text-muted-foreground hover:text-chart-3 transition-colors"
            >
              Kitchen
            </Link>
            <Link
              href="/billing"
              className="px-2 py-0.5 rounded-md hover:bg-card text-muted-foreground hover:text-chart-4 transition-colors"
            >
              Billing
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

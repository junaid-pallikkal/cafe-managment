"use client";

import React from "react";
import { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/server/actions/auth-actions";
import {
  UtensilsCrossed,
  LogOut,
  Shield,
  ChefHat,
  Receipt,
  ConciergeBell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppHeaderProps {
  user: SessionUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  const [currentTime, setCurrentTime] = React.useState("");

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now)
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleMeta = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          icon: Shield,
          label: "Admin",
          badgeClass: "bg-chart-5/10 text-chart-5 border-chart-5/30",
          dotColor: "bg-chart-5",
        };
      case "CAPTAIN":
        return {
          icon: ConciergeBell,
          label: "Captain",
          badgeClass: "bg-primary/10 text-primary border-primary/30",
          dotColor: "bg-primary",
        };
      case "KITCHEN":
        return {
          icon: ChefHat,
          label: "Kitchen",
          badgeClass: "bg-chart-3/15 text-chart-3 border-chart-3/30",
          dotColor: "bg-chart-3",
        };
      case "BILLING":
        return {
          icon: Receipt,
          label: "Billing",
          badgeClass: "bg-chart-4/15 text-chart-4 border-chart-4/30",
          dotColor: "bg-chart-4",
        };
      default:
        return {
          icon: Shield,
          label: role,
          badgeClass: "bg-muted text-muted-foreground border-border",
          dotColor: "bg-muted-foreground",
        };
    }
  };

  const meta = getRoleMeta(user.role);
  const RoleIcon = meta.icon;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-md px-4 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Shift */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                Emerald
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">• Ops</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/25">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {currentTime || "00:00:00"}
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badgeClass}`}
          >
            <RoleIcon className="h-3 w-3" />
            <span>{meta.label}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border/70">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/15 text-primary text-[11px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">{user.email}</span>
            </div>
          </div>

          <form action={logoutAction} className="pl-1">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline ml-1.5">Sign Out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

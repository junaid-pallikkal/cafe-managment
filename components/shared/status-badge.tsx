import React from "react";
import { OrderStatus, ItemStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatus | ItemStatus | string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

const statusConfig: Record<
  string,
  { label: string; dotColor: string; bg: string; text: string; border: string }
> = {
  DRAFT: {
    label: "Draft",
    dotColor: "bg-muted-foreground",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  SENT_TO_KITCHEN: {
    label: "Sent to Kitchen",
    dotColor: "bg-chart-3",
    bg: "bg-chart-3/15",
    text: "text-chart-3",
    border: "border-chart-3/30",
  },
  QUEUED: {
    label: "Queued",
    dotColor: "bg-chart-3",
    bg: "bg-chart-3/15",
    text: "text-chart-3",
    border: "border-chart-3/30",
  },
  PREPARING: {
    label: "Preparing",
    dotColor: "bg-chart-4 animate-pulse",
    bg: "bg-chart-4/15",
    text: "text-chart-4",
    border: "border-chart-4/30",
  },
  READY: {
    label: "Ready",
    dotColor: "bg-primary",
    bg: "bg-primary/15",
    text: "text-accent-foreground",
    border: "border-primary/30",
  },
  SERVED: {
    label: "Served",
    dotColor: "bg-chart-2",
    bg: "bg-chart-2/15",
    text: "text-chart-2",
    border: "border-chart-2/30",
  },
  BILL_REQUESTED: {
    label: "Bill Requested",
    dotColor: "bg-chart-5 animate-pulse",
    bg: "bg-chart-5/15",
    text: "text-chart-5",
    border: "border-chart-5/30",
  },
  PAID: {
    label: "Paid",
    dotColor: "bg-primary",
    bg: "bg-primary/20",
    text: "text-foreground",
    border: "border-primary/40",
  },
  CANCELLED: {
    label: "Cancelled",
    dotColor: "bg-destructive",
    bg: "bg-destructive/15",
    text: "text-destructive",
    border: "border-destructive/30",
  },
};

export function StatusBadge({ status, className, size = "default" }: StatusBadgeProps) {
  const conf = statusConfig[status] || {
    label: status,
    dotColor: "bg-muted-foreground",
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    default: "px-2.5 py-0.5 text-xs gap-1.5",
    lg: "px-3 py-1 text-xs gap-2 font-semibold",
  }[size];

  const dotSizes = {
    sm: "h-1.5 w-1.5",
    default: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border transition-colors select-none",
        conf.bg,
        conf.text,
        conf.border,
        sizeClasses,
        className
      )}
    >
      <span className={cn("rounded-full shrink-0", conf.dotColor, dotSizes)} />
      <span className="leading-none">{conf.label}</span>
    </span>
  );
}

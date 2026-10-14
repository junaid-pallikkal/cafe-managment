import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Avatar({ className, size = "md", children, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  }[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold uppercase select-none border border-border",
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

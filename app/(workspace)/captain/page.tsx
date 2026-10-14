import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { TableGrid, TableWithActiveOrder } from "@/components/captain/table-grid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { PlusCircle, ShoppingBag, Eye, Users, Utensils, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { formatElapsedTime } from "@/lib/formatters/date";
import { formatCurrency } from "@/lib/formatters/currency";
import { serializeForClient } from "@/lib/utils";

export default async function CaptainOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch all active tables
  const tables = await prisma.diningTable.findMany({
    where: { isActive: true },
    orderBy: { label: "asc" },
  });

  // Fetch active orders (non-paid, non-cancelled)
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        notIn: ["PAID", "CANCELLED"],
      },
    },
    include: {
      items: true,
      table: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Map active dine-in orders to tables
  const tableOrderMap = new Map();
  const takeawayOrders: typeof activeOrders = [];

  for (const order of activeOrders) {
    if (order.type === "DINE_IN" && order.tableId) {
      tableOrderMap.set(order.tableId, order);
    } else if (order.type === "TAKEAWAY") {
      takeawayOrders.push(order);
    }
  }

  const tablesWithOrders: TableWithActiveOrder[] = tables.map((t) => ({
    ...t,
    activeOrder: tableOrderMap.get(t.id) || null,
  }));

  const occupiedTables = tablesWithOrders.filter((t) => t.activeOrder !== null);
  const availableTables = tablesWithOrders.filter((t) => t.activeOrder === null);
  const readyOrdersCount = activeOrders.filter((o) => o.status === "READY").length;

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Floor Operations
            </h1>
            <Badge variant="secondary" className="gap-1 border-primary/30 text-primary text-[11px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live Dining
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage table seating, create dine-in orders, and monitor kitchen ticket readiness.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/captain/orders/new?type=TAKEAWAY">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold border-border/80 text-foreground">
              <ShoppingBag className="h-3.5 w-3.5 text-chart-4" />
              <span>New Takeaway</span>
            </Button>
          </Link>
          <Link href="/captain/orders/new">
            <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Dine-In Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric KPI Cards Block */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Tables */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dining Tables
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Utensils className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {tables.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {tables.reduce((acc, t) => acc + t.capacity, 0)} total seat capacity
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Occupied Tables */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Occupied Tables
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-chart-3/15 text-chart-3 flex items-center justify-center border border-chart-3/20">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-chart-3 tracking-tight">
              {occupiedTables.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}% floor occupancy
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Available Tables */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vacant Tables
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-primary tracking-tight">
              {availableTables.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ready for guest seating
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Ready to Serve / Urgent */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ready to Serve
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-chart-4/15 text-chart-4 flex items-center justify-center border border-chart-4/20">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {readyOrdersCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dishes prepared in kitchen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dine-in Table Grid Block */}
      <TableGrid tables={serializeForClient(tablesWithOrders)} />

      {/* Active Takeaways Section */}
      {takeawayOrders.length > 0 && (
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="p-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <span>Active Takeaway Orders ({takeawayOrders.length})</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Takeaway tickets currently being prepared or awaiting payment/pickup.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {takeawayOrders.map((order) => (
                <Card key={order.id} className="border-border/80 bg-muted/30 rounded-lg">
                  <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-semibold text-foreground">
                        Takeaway #{order.orderNumber}
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatElapsedTime(order.sentAt || order.createdAt)}
                      </span>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </CardHeader>
                  <CardContent className="p-3.5 pt-1 space-y-2.5">
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>{order.items.length} items</span>
                      <span className="font-mono font-bold text-foreground">{formatCurrency(order.total)}</span>
                    </div>
                    <Link href={`/captain/orders/${order.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1 border-border/80">
                        <Eye className="h-3 w-3" />
                        <span>View Ticket</span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

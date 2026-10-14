import React from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime, formatElapsedTime } from "@/lib/formatters/date";
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Utensils,
  FileText,
  Plus,
  Activity,
  ArrowUpRight,
  Clock,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 1. Financial aggregates & today's payments
  const todayPayments = await prisma.payment.findMany({
    where: { createdAt: { gte: startOfDay } },
    include: {
      order: {
        include: {
          table: true,
          items: true,
        },
      },
      cashier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const grossSales = todayPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const paidOrdersCount = todayPayments.length;

  const todayPurchases = await prisma.purchase.findMany({
    where: { purchasedAt: { gte: startOfDay } },
    orderBy: { purchasedAt: "desc" },
  });
  const totalPurchases = todayPurchases.reduce((acc, p) => acc + Number(p.amount), 0);

  const todayExpenses = await prisma.expense.findMany({
    where: { spentAt: { gte: startOfDay } },
    orderBy: { spentAt: "desc" },
  });
  const totalExpenses = todayExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const totalOutflow = totalPurchases + totalExpenses;
  const estimatedNetOperating = grossSales - totalOutflow;

  // 2. Operational active tickets
  const openOrders = await prisma.order.findMany({
    where: { status: { notIn: ["PAID", "CANCELLED"] } },
    include: {
      table: true,
      items: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const ordersByStatus = {
    SENT_TO_KITCHEN: openOrders.filter((o) => o.status === "SENT_TO_KITCHEN").length,
    PREPARING: openOrders.filter((o) => o.status === "PREPARING").length,
    READY: openOrders.filter((o) => o.status === "READY").length,
    SERVED: openOrders.filter((o) => o.status === "SERVED").length,
    BILL_REQUESTED: openOrders.filter((o) => o.status === "BILL_REQUESTED").length,
  };

  // 3. Recent Audit Logs
  const recentAuditLogs = await prisma.auditLog.findMany({
    take: 12,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, role: true } } },
  });

  // Calculate live operational metrics
  const activeDineInCount = openOrders.filter((o) => o.type === "DINE_IN").length;
  const activeTakeawayCount = openOrders.filter((o) => o.type === "TAKEAWAY").length;
  const urgentOrdersCount = ordersByStatus.BILL_REQUESTED + ordersByStatus.READY;

  return (
    <div className="space-y-6">
      {/* Top Header Block (shadcn Dashboard 01 style) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <Badge variant="secondary" className="gap-1 border-primary/30 text-primary text-[11px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live Shift
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time restaurant operational flow, financial metrics, and shift throughput.
          </p>
        </div>

        {/* Action Buttons Block */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/reports">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border/80 text-foreground"
            >
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>Analytics</span>
            </Button>
          </Link>
          <Link href="/admin/purchases">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border/80 text-foreground"
            >
              <Plus className="h-3.5 w-3.5 text-chart-4" />
              <span>Purchase</span>
            </Button>
          </Link>
          <Link href="/admin/expenses">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border/80 text-foreground"
            >
              <Plus className="h-3.5 w-3.5 text-chart-5" />
              <span>Expense</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs Navigation Block */}
      <Tabs defaultValue="overview" className="space-y-5">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted p-1 border border-border">
            <TabsTrigger value="overview" className="text-xs font-medium">
              Overview
            </TabsTrigger>
            <TabsTrigger value="operations" className="text-xs font-medium">
              Live Operations ({openOrders.length})
            </TabsTrigger>
            <TabsTrigger value="settlements" className="text-xs font-medium">
              Settlements ({paidOrdersCount})
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs font-medium">
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <div className="hidden sm:flex items-center text-[11px] text-muted-foreground gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated live from database</span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW BLOCK (shadcn Dashboard 01 iconic structure) */}
        <TabsContent value="overview" className="space-y-5">
          {/* 4 Metric KPI Cards Block */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Revenue */}
            <Card className="border-border/80 bg-card rounded-xl shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {formatCurrency(grossSales)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <span className="font-semibold text-primary">+{paidOrdersCount} bills</span>
                  <span>settled today</span>
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Active Floor Tickets */}
            <Card className="border-border/80 bg-card rounded-xl shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Tickets
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-chart-4/15 text-chart-4 flex items-center justify-center border border-chart-4/20">
                  <Utensils className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {openOrders.length}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <span>{activeDineInCount} dine-in</span>
                  <span>•</span>
                  <span>{activeTakeawayCount} takeaway</span>
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Procurements & Expenses */}
            <Card className="border-border/80 bg-card rounded-xl shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Shift Outflow
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-chart-3/15 text-chart-3 flex items-center justify-center border border-chart-3/20">
                  <CreditCard className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {formatCurrency(totalOutflow)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {todayPurchases.length} purchases • {todayExpenses.length} expenses
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Net Operating Margin */}
            <Card className="border-border/80 bg-card rounded-xl shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Net Operating Margin
                </CardTitle>
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                    estimatedNetOperating >= 0
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className={`text-2xl font-bold font-mono tracking-tight ${
                    estimatedNetOperating >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {formatCurrency(estimatedNetOperating)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Inflow minus shift expenses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 7-Column Split Block: Throughput (Col 4) & Recent Sales (Col 3) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 items-start">
            {/* Left: Operational Pipeline Block (Col-span-4) */}
            <Card className="lg:col-span-4 border-border/80 bg-card rounded-xl shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Operational Throughput
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Live ticket progression across kitchen, dining floor, and cashier.
                    </CardDescription>
                  </div>
                  {urgentOrdersCount > 0 && (
                    <Badge variant="outline" className="text-[11px] font-semibold border-chart-5/40 text-chart-5 bg-chart-5/10">
                      {urgentOrdersCount} Actionable
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Station Pipeline Progress Bars */}
                <div className="space-y-3">
                  {/* Item: Sent to Kitchen */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-chart-3" />
                        <span>New in Kitchen Queue</span>
                      </span>
                      <span className="font-mono font-bold text-chart-3">
                        {ordersByStatus.SENT_TO_KITCHEN} orders
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-chart-3 transition-all"
                        style={{
                          width: `${
                            openOrders.length > 0
                              ? Math.max(8, (ordersByStatus.SENT_TO_KITCHEN / openOrders.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Item: Preparing */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-chart-4" />
                        <span>Cooking / Preparing</span>
                      </span>
                      <span className="font-mono font-bold text-chart-4">
                        {ordersByStatus.PREPARING} orders
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-chart-4 transition-all"
                        style={{
                          width: `${
                            openOrders.length > 0
                              ? Math.max(8, (ordersByStatus.PREPARING / openOrders.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Item: Ready */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span>Ready to Serve</span>
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {ordersByStatus.READY} orders
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${
                            openOrders.length > 0
                              ? Math.max(8, (ordersByStatus.READY / openOrders.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Item: Served */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-chart-2" />
                        <span>Dining / Food Served</span>
                      </span>
                      <span className="font-mono font-bold text-chart-2">
                        {ordersByStatus.SERVED} orders
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-chart-2 transition-all"
                        style={{
                          width: `${
                            openOrders.length > 0
                              ? Math.max(8, (ordersByStatus.SERVED / openOrders.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Item: Bill Requested */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-chart-5" />
                        <span>Bill Requested / Ready to Settle</span>
                      </span>
                      <span className="font-mono font-bold text-chart-5">
                        {ordersByStatus.BILL_REQUESTED} orders
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-chart-5 transition-all"
                        style={{
                          width: `${
                            openOrders.length > 0
                              ? Math.max(8, (ordersByStatus.BILL_REQUESTED / openOrders.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Station Quick Jump Cards Block */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Link href="/captain" className="group">
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted/70 transition-all flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <Utensils className="h-4 w-4 text-primary" />
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-foreground">Captain Floor</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {activeDineInCount} active dine-in
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/kitchen" className="group">
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted/70 transition-all flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <Receipt className="h-4 w-4 text-chart-3" />
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-foreground">Kitchen Display</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {ordersByStatus.SENT_TO_KITCHEN + ordersByStatus.PREPARING} in prep
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/billing" className="group">
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted/70 transition-all flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <Receipt className="h-4 w-4 text-chart-5" />
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-foreground">Billing Desk</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {ordersByStatus.BILL_REQUESTED} awaiting cashier
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Right: Recent Settlements Block (Col-span-3 - shadcn Recent Sales block) */}
            <Card className="lg:col-span-3 border-border/80 bg-card rounded-xl shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Recent Settlements
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {paidOrdersCount > 0
                      ? `${paidOrdersCount} bills settled today`
                      : "No settlements today yet"}
                  </CardDescription>
                </div>
                <Link href="/billing">
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {todayPayments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="font-medium text-foreground">No settled bills today</p>
                    <p className="text-[11px] mt-0.5">Payments settled at the cashier will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50 max-h-[380px] overflow-y-auto">
                    {todayPayments.slice(0, 6).map((payment) => (
                      <div
                        key={payment.id}
                        className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" className="h-8 w-8 border-border">
                            <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground font-mono">
                              {payment.method === "CASH" ? "₹" : payment.method.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <span>#{payment.order.orderNumber}</span>
                              <Badge variant="outline" className="text-[9px] py-0 px-1 border-border/70 text-muted-foreground font-mono">
                                {payment.method}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {payment.order.table?.label ? `Table ${payment.order.table.label}` : "Takeaway"} • {payment.cashier.name}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-primary">
                            +{formatCurrency(payment.amount)}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {formatDateTime(payment.createdAt).split(",")[1] || formatDateTime(payment.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Audit Stream Preview */}
          <Card className="border-border/80 bg-card rounded-xl shadow-xs">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-chart-5" />
                <div>
                  <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Recent Operations Audit Stream
                  </CardTitle>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                Tamper-Evident Log
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {recentAuditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No audit log entries recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentAuditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="p-3 px-4 text-xs flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-chart-5 shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground text-xs">
                            {log.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            by <strong>{log.actor.name}</strong> ({log.actor.role})
                          </span>
                          {log.reason && (
                            <span className="ml-2 text-destructive bg-destructive/10 px-1.5 py-0.5 rounded text-[10px] border border-destructive/30">
                              Reason: {log.reason}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-3">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: LIVE OPERATIONS BLOCK */}
        <TabsContent value="operations" className="space-y-4">
          <Card className="border-border/80 bg-card rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground">
                Active Orders Board ({openOrders.length})
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                All non-settled dining and takeaway tickets currently in progress across stations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {openOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No active orders right now. The kitchen queue is clear!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Order #</th>
                        <th className="p-3">Type / Destination</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Items</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Captain</th>
                        <th className="p-3">Elapsed</th>
                        <th className="p-3 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {openOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-foreground">
                            #{order.orderNumber}
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-foreground">
                              {order.type === "DINE_IN"
                                ? `Table ${order.table?.label}`
                                : "Takeaway"}
                            </span>
                          </td>
                          <td className="p-3">
                            <StatusBadge status={order.status} size="sm" />
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {order.items.length} items ({order.items.reduce((s, i) => s + i.quantity, 0)} portions)
                          </td>
                          <td className="p-3 font-mono font-bold text-foreground">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {order.createdBy.name}
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {formatElapsedTime(order.sentAt || order.createdAt)}
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <Link href={`/captain/orders/${order.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] px-2.5 border-border/80"
                              >
                                View Ticket
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SETTLEMENTS BLOCK */}
        <TabsContent value="settlements" className="space-y-4">
          <Card className="border-border/80 bg-card rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Today&apos;s Settled Receipts ({todayPayments.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Immutable record of customer payments settled in current shift.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">Gross Volume</span>
                <span className="text-base font-bold font-mono text-primary">
                  {formatCurrency(grossSales)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {todayPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No settlements recorded yet today.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Receipt #</th>
                        <th className="p-3">Order #</th>
                        <th className="p-3">Destination</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Cashier</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 pr-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-mono text-xs">
                      {todayPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3 pl-4 font-bold text-foreground">{p.receiptNo}</td>
                          <td className="p-3 text-foreground">#{p.order.orderNumber}</td>
                          <td className="p-3 font-sans text-muted-foreground">
                            {p.order.table?.label ? `Table ${p.order.table.label}` : "Takeaway"}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] font-mono border-border/80">
                              {p.method}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold text-primary">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="p-3 font-sans text-muted-foreground">{p.cashier.name}</td>
                          <td className="p-3 text-muted-foreground">{formatDateTime(p.createdAt)}</td>
                          <td className="p-3 pr-4 text-right font-sans">
                            <Link href={`/billing/bills/${p.orderId}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: AUDIT TRAIL BLOCK */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="border-border/80 bg-card rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-chart-5" />
                <span>Security & Privilege Audit Trail</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Tamper-evident operational audit logs recording sensitive mutations, cancellations, and supervisor overrides.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No audit logs recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentAuditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 px-4 text-xs space-y-1 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-xs">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px] flex items-center gap-2">
                        <span>
                          Actor: <strong>{log.actor.name}</strong> ({log.actor.role})
                        </span>
                        <span>•</span>
                        <span>Entity: {log.entityType}</span>
                        {log.entityId && (
                          <span className="font-mono text-[10px]">#{log.entityId.slice(-6)}</span>
                        )}
                      </div>
                      {log.reason && (
                        <div className="text-destructive bg-destructive/10 px-2 py-1 rounded text-[11px] border border-destructive/30 mt-1">
                          Reason: {log.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

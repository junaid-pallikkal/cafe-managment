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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime, formatElapsedTime } from "@/lib/formatters/date";
import {
  Receipt,
  CheckCircle,
  ArrowRight,
  Plus,
  Clock,
  Banknote,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default async function BillingDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Query pending bills (BILL_REQUESTED, and SERVED/READY waiting for bill)
  const pendingBills = await prisma.order.findMany({
    where: {
      status: {
        in: ["BILL_REQUESTED", "SERVED", "READY"],
      },
    },
    include: {
      table: true,
      createdBy: { select: { name: true } },
      items: true,
    },
    orderBy: {
      billRequestedAt: "asc",
    },
  });

  // Query today's paid payments
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayPayments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startOfDay },
    },
    include: {
      order: {
        include: { table: true },
      },
      cashier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const totalCollectedToday = todayPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const avgTicket =
    todayPayments.length > 0 ? totalCollectedToday / todayPayments.length : 0;

  const urgentBillsCount = pendingBills.filter(
    (b) => b.status === "BILL_REQUESTED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Billing & Settlement
            </h1>
            {urgentBillsCount > 0 ? (
              <Badge variant="outline" className="border-chart-5/40 text-chart-5 bg-chart-5/10 text-[11px] font-semibold gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-chart-5 animate-pulse" />
                {urgentBillsCount} Bill{urgentBillsCount > 1 ? "s" : ""} Requested
              </Badge>
            ) : (
              <Badge variant="secondary" className="border-border text-muted-foreground text-[11px]">
                Queue Clear
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Process guest settlements, generate tax invoices, and manage direct takeaway orders.
          </p>
        </div>

        <Link href="/billing/takeaway">
          <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Fast Takeaway Bill</span>
          </Button>
        </Link>
      </div>

      {/* 4 Metric KPI Cards Block */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Pending Queue */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Queue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-chart-5/15 text-chart-5 flex items-center justify-center border border-chart-5/20">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {pendingBills.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {urgentBillsCount} awaiting immediate payment
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Settled Today */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settled Today
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {todayPayments.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Settled receipts in current shift
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Collected Volume */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cashier Inflow
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-primary tracking-tight">
              {formatCurrency(totalCollectedToday)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Gross shift revenue settled
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Average Bill Size */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Bill
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-chart-4/15 text-chart-4 flex items-center justify-center border border-chart-4/20">
              <Banknote className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatCurrency(avgTicket)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Per settled table or takeaway
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Block */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-muted p-1 border border-border">
          <TabsTrigger value="pending" className="text-xs font-medium">
            Pending Bills ({pendingBills.length})
          </TabsTrigger>
          <TabsTrigger value="settled" className="text-xs font-medium">
            Settled Receipts ({todayPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENDING BILLS */}
        <TabsContent value="pending" className="space-y-4">
          {pendingBills.length === 0 ? (
            <Card className="border-dashed border-border bg-card p-12 text-center rounded-xl">
              <CheckCircle className="h-10 w-10 mx-auto text-primary mb-2.5" />
              <h3 className="text-sm font-bold text-foreground">All Customer Bills Settled</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                When a Captain marks an order as Served or requests a bill from a table, it will instantly appear in this queue.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {pendingBills.map((order) => {
                const isUrgent = order.status === "BILL_REQUESTED";
                return (
                  <Card
                    key={order.id}
                    className={`border rounded-xl transition-all shadow-xs ${
                      isUrgent
                        ? "border-chart-5/40 bg-chart-5/10 ring-1 ring-chart-5/30"
                        : "border-border/80 bg-card"
                    }`}
                  >
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground leading-tight">
                          Order #{order.orderNumber}
                        </CardTitle>
                        <span className="text-[11px] text-muted-foreground">
                          {order.type === "DINE_IN" ? `Table ${order.table?.label}` : "Takeaway"}
                        </span>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-3">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{order.items.length} items ({order.items.reduce((s, i) => s + i.quantity, 0)} portions)</span>
                        <span className="font-bold text-foreground font-mono text-base">
                          {formatCurrency(order.total)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                        <span>Captain: {order.createdBy.name}</span>
                        <span className="font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatElapsedTime(order.billRequestedAt || order.createdAt)}
                        </span>
                      </div>

                      <Link href={`/billing/bills/${order.id}`} className="block pt-1">
                        <Button
                          size="sm"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 gap-1.5 shadow-xs"
                        >
                          <span>Settle & Issue Invoice</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: SETTLED RECEIPTS HISTORY */}
        <TabsContent value="settled" className="space-y-4">
          <Card className="border-border/80 bg-card rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Today&apos;s Settled Receipts
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Completed customer payments recorded at this billing terminal.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">Shift Total</span>
                <span className="text-base font-bold font-mono text-primary">
                  {formatCurrency(totalCollectedToday)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {todayPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No settled receipts recorded yet today.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 pl-4">Receipt</th>
                        <th className="p-3">Order</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Cashier</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 pr-4 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-mono text-xs">
                      {todayPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3 pl-4 font-bold text-foreground">{p.receiptNo}</td>
                          <td className="p-3 text-foreground">
                            #{p.order.orderNumber} ({p.order.table?.label ? `Table ${p.order.table.label}` : "Takeaway"})
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] font-mono border-border">
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
      </Tabs>
    </div>
  );
}

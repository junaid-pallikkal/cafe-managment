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
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";
import {
  CreditCard,
  Banknote,
  QrCode,
  TrendingUp,
  Utensils,
  Receipt,
  ArrowLeft,
  PieChart,
} from "lucide-react";
import Link from "next/link";

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  // Fetch all payments
  const allPayments = await prisma.payment.findMany({
    include: {
      order: {
        include: {
          items: true,
          table: true,
        },
      },
      cashier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSalesRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Group by payment method
  const methodMap: Record<string, { count: number; total: number }> = {
    CASH: { count: 0, total: 0 },
    UPI: { count: 0, total: 0 },
    CARD: { count: 0, total: 0 },
    OTHER: { count: 0, total: 0 },
  };

  for (const p of allPayments) {
    if (!methodMap[p.method]) {
      methodMap[p.method] = { count: 0, total: 0 };
    }
    methodMap[p.method].count += 1;
    methodMap[p.method].total += Number(p.amount);
  }

  // Aggregate top-selling items
  const itemSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  let totalItemsSold = 0;

  for (const p of allPayments) {
    for (const item of p.order.items) {
      const existing = itemSalesMap.get(item.nameSnapshot);
      const lineRev = Number(item.unitPrice) * item.quantity;
      totalItemsSold += item.quantity;
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += lineRev;
      } else {
        itemSalesMap.set(item.nameSnapshot, {
          name: item.nameSnapshot,
          quantity: item.quantity,
          revenue: lineRev,
        });
      }
    }
  }

  const topItems = Array.from(itemSalesMap.values()).sort(
    (a, b) => b.quantity - a.quantity
  );

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Analytics & Reports
            </h1>
            <Badge variant="outline" className="border-border text-muted-foreground text-[11px]">
              {allPayments.length} Settlements
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Revenue trends, settlement channel breakdown, and top performing menu delicacies.
          </p>
        </div>

        <Link href="/admin">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-border/80 text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>

      {/* 4 Metric KPI Cards Block */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Gross Settled */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Settled Volume
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-primary tracking-tight">
              {formatCurrency(totalSalesRevenue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {allPayments.length} total receipts
            </p>
          </CardContent>
        </Card>

        {/* Card 2: UPI / QR Payments */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              UPI / QR Settlements
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-chart-4/15 text-chart-4 flex items-center justify-center border border-chart-4/20">
              <QrCode className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatCurrency(methodMap.UPI.total)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {methodMap.UPI.count} transactions (
              {totalSalesRevenue > 0
                ? Math.round((methodMap.UPI.total / totalSalesRevenue) * 100)
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Cash Payments */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cash Drawer
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-chart-3/15 text-chart-3 flex items-center justify-center border border-chart-3/20">
              <Banknote className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatCurrency(methodMap.CASH.total)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {methodMap.CASH.count} cash settlements
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Card POS */}
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Card Terminal
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-chart-5/15 text-chart-5 flex items-center justify-center border border-chart-5/20">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {formatCurrency(methodMap.CARD.total)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {methodMap.CARD.count} card swipes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Column Split Grid: Top Delicacies (Col 4) & Channel Breakdown (Col 3) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 items-start">
        {/* Left: Top Delicacies Leaderboard (Col-span-4) */}
        <Card className="lg:col-span-4 border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  <span>Top Selling Delicacies</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Performance ranking by quantity ordered and revenue generated.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                {totalItemsSold} Total Portions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {topItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No menu items sales data recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {topItems.slice(0, 8).map((item, idx) => {
                  const sharePct = totalItemsSold > 0 ? (item.quantity / totalItemsSold) * 100 : 0;
                  return (
                    <div key={item.name} className="p-3.5 px-4 space-y-1.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-foreground font-bold text-[10px] border border-border">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-foreground">{item.name}</span>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground">
                            {item.quantity} orders
                          </span>
                          <span className="font-mono font-bold text-primary">
                            {formatCurrency(item.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, sharePct * 2))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Payment Channels Share (Col-span-3) */}
        <Card className="lg:col-span-3 border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4 text-chart-4" />
              <span>Settlement Mix</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Revenue distribution across settlement modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* UPI Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-chart-4" />
                  <span>UPI / QR</span>
                </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(methodMap.UPI.total)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-chart-4"
                  style={{
                    width: `${
                      totalSalesRevenue > 0
                        ? (methodMap.UPI.total / totalSalesRevenue) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Cash Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-chart-3" />
                  <span>Cash</span>
                </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(methodMap.CASH.total)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-chart-3"
                  style={{
                    width: `${
                      totalSalesRevenue > 0
                        ? (methodMap.CASH.total / totalSalesRevenue) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Card Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-chart-5" />
                  <span>Card POS</span>
                </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(methodMap.CARD.total)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-chart-5"
                  style={{
                    width: `${
                      totalSalesRevenue > 0
                        ? (methodMap.CARD.total / totalSalesRevenue) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Average Ticket Size Card */}
            <div className="p-3 rounded-lg border border-border/80 bg-muted/40 mt-3 space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Average Receipt Value
              </div>
              <div className="text-xl font-bold font-mono text-primary">
                {formatCurrency(
                  allPayments.length > 0 ? totalSalesRevenue / allPayments.length : 0
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Per settled dining or takeaway transaction
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full-width Receipts Ledger */}
      <Card className="border-border/80 bg-card rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-chart-5" />
              <span>Tax Receipts Ledger ({allPayments.length})</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Authoritative transaction audit records including payment method and cashier identity.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                  <th className="p-3 pr-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {allPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  allPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-foreground">
                        {p.receiptNo}
                      </td>
                      <td className="p-3 font-mono">#{p.order.orderNumber}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-mono border-border">
                          {p.method}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-primary">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="p-3 text-muted-foreground">{p.cashier.name}</td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <Link href={`/billing/bills/${p.orderId}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground">
                            View Receipt
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

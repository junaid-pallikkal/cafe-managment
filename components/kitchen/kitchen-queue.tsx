"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Order, OrderItem, DiningTable } from "@prisma/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateOrderItemStatusAction } from "@/server/actions/order-actions";
import { formatElapsedTime, formatTime } from "@/lib/formatters/date";
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShoppingBag,
  Utensils,
  StickyNote,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface KitchenOrder extends Order {
  table: DiningTable | null;
  items: OrderItem[];
}

interface KitchenQueueProps {
  orders: KitchenOrder[];
}

export function KitchenQueue({ orders }: KitchenQueueProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"ALL" | "SENT_TO_KITCHEN" | "PREPARING" | "READY">("ALL");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Auto-refresh poll every 8 seconds for Kitchen Display
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
        setLastRefreshed(new Date());
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [router]);

  const handleUpdateItemStatus = (orderItemId: string, newStatus: "QUEUED" | "PREPARING" | "READY") => {
    startTransition(async () => {
      const res = await updateOrderItemStatusAction({
        orderItemId,
        status: newStatus,
      });
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleMarkAllReady = (order: KitchenOrder) => {
    startTransition(async () => {
      for (const item of order.items) {
        if (item.status !== "READY" && item.status !== "CANCELLED") {
          await updateOrderItemStatusAction({
            orderItemId: item.id,
            status: "READY",
          });
        }
      }
      router.refresh();
    });
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    return o.status === activeTab;
  });

  const newCount = orders.filter((o) => o.status === "SENT_TO_KITCHEN").length;
  const preparingCount = orders.filter((o) => o.status === "PREPARING").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="space-y-5">
      {/* KDS Header with Sleek Minimalist Dark Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card text-foreground p-4 rounded-xl shadow-xs border border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-3/20 text-chart-3 border border-chart-3/30 font-bold">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">
                Kitchen Display System
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-chart-3/20 text-chart-3 border border-chart-3/30 font-mono font-semibold uppercase">
                Station
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>Live auto-sync • {formatTime(lastRefreshed)}</span>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            router.refresh();
            setLastRefreshed(new Date());
          }}
          disabled={isPending}
          className="border-border bg-muted/60 text-foreground hover:bg-muted text-xs h-8 gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </Button>
      </div>

      {/* 4 Metric KPI Cards Block */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Queue
            </span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <ChefHat className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {orders.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Active tickets across kitchen
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Incoming Orders
            </span>
            <div className="h-8 w-8 rounded-lg bg-chart-3/15 text-chart-3 flex items-center justify-center border border-chart-3/20">
              <Flame className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-chart-3 tracking-tight">
              {newCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Awaiting chef preparation
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cooking / Prep
            </span>
            <div className="h-8 w-8 rounded-lg bg-chart-4/15 text-chart-4 flex items-center justify-center border border-chart-4/20">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-chart-4 tracking-tight">
              {preparingCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Currently on the stove / station
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ready for Service
            </span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold font-mono text-primary tracking-tight">
              {readyCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Plated and ready to dispatch
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === "ALL"
              ? "bg-foreground text-background shadow-xs font-semibold"
              : "bg-card text-muted-foreground border border-border/70 hover:bg-muted"
          }`}
        >
          All Tickets ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("SENT_TO_KITCHEN")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "SENT_TO_KITCHEN"
              ? "bg-chart-3 text-primary-foreground shadow-xs font-semibold"
              : "bg-card text-chart-3 border border-chart-3/30 hover:bg-chart-3/10"
          }`}
        >
          <span>Incoming</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-chart-3/20 text-chart-3 font-bold font-mono">
            {newCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("PREPARING")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "PREPARING"
              ? "bg-chart-4 text-primary-foreground shadow-xs font-semibold"
              : "bg-card text-chart-4 border border-chart-4/30 hover:bg-chart-4/10"
          }`}
        >
          <span>Cooking</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-chart-4/20 text-chart-4 font-bold font-mono">
            {preparingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("READY")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "READY"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-card text-primary border border-primary/30 hover:bg-primary/10"
          }`}
        >
          <span>Ready</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-bold font-mono">
            {readyCount}
          </span>
        </button>
      </div>

      {/* Tickets Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <ChefHat className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs font-semibold text-foreground">No tickets in this state</p>
          <p className="text-[11px] text-muted-foreground">New orders will arrive automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredOrders.map((order) => {
            const isTakeaway = order.type === "TAKEAWAY";
            const elapsed = formatElapsedTime(order.sentAt || order.createdAt);
            const isAllReady = order.status === "READY";

            return (
              <Card
                key={order.id}
                className={`overflow-hidden border rounded-xl shadow-xs transition-all ${
                  isAllReady
                    ? "border-primary/50 bg-primary/10"
                    : order.status === "PREPARING"
                    ? "border-chart-4/40 bg-card"
                    : "border-chart-3/40 bg-card"
                }`}
              >
                {/* Minimal ticket header */}
                <CardHeader className="bg-muted/60 text-foreground p-3 pb-2.5 space-y-2 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold tracking-tight text-chart-3 font-mono">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-card text-foreground border border-border">
                        {isTakeaway ? (
                          <span className="flex items-center gap-1 text-primary">
                            <ShoppingBag className="h-3 w-3" /> Takeaway
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-chart-4">
                            <Utensils className="h-3 w-3" /> Table {order.table?.label || "--"}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-chart-3 bg-card px-2 py-0.5 rounded border border-border/60">
                      <Clock className="h-3 w-3" />
                      <span>{elapsed}</span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="text-[11px] bg-chart-3/15 text-chart-3 p-1.5 rounded border border-chart-3/30 flex items-start gap-1">
                      <StickyNote className="h-3 w-3 shrink-0 text-chart-3 mt-0.5" />
                      <span>{order.notes}</span>
                    </div>
                  )}
                </CardHeader>

                {/* Line Items List */}
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="divide-y divide-border/50">
                    {order.items.map((item) => {
                      const isItemReady = item.status === "READY";

                      return (
                        <div
                          key={item.id}
                          className={`py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 ${
                            isItemReady ? "opacity-50" : ""
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-bold text-xs font-mono ${
                                  isItemReady
                                    ? "bg-muted text-muted-foreground border border-border"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                {item.quantity}×
                              </span>
                              <span
                                className={`font-semibold text-xs leading-tight ${
                                  isItemReady ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {item.nameSnapshot}
                              </span>
                            </div>

                            {item.notes && (
                              <div className="text-[10px] text-chart-3 bg-chart-3/15 px-1.5 py-0.5 rounded border border-chart-3/30">
                                {item.notes}
                              </div>
                            )}
                          </div>

                          {/* Action toggle */}
                          <div className="shrink-0 flex items-center gap-1">
                            {item.status === "QUEUED" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateItemStatus(item.id, "PREPARING")}
                                disabled={isPending}
                                className="bg-chart-4 hover:bg-chart-4/90 text-primary-foreground font-medium text-[11px] h-7 px-2.5 gap-1 shadow-xs"
                              >
                                <Flame className="h-3 w-3" />
                                <span>Cook</span>
                              </Button>
                            )}

                            {item.status === "PREPARING" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateItemStatus(item.id, "READY")}
                                disabled={isPending}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-[11px] h-7 px-2.5 gap-1 shadow-xs"
                              >
                                <Check className="h-3 w-3" />
                                <span>Ready</span>
                              </Button>
                            )}

                            {isItemReady && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/25">
                                <Check className="h-3 w-3" />
                                <span>Done</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mark All Ready shortcut */}
                  {!isAllReady && (
                    <div className="pt-2 border-t border-border/50">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAllReady(order)}
                        disabled={isPending}
                        className="w-full text-xs font-semibold h-8 text-primary hover:bg-primary/10 hover:text-primary border-primary/30 gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>Mark All Ready</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

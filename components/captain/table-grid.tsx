"use client";

import React, { useTransition, useState, useMemo } from "react";
import Link from "next/link";
import { DiningTable, Order, OrderItem } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { markOrderServedAction, requestBillAction } from "@/server/actions/order-actions";
import { formatElapsedTime } from "@/lib/formatters/date";
import { formatCurrency } from "@/lib/formatters/currency";
import {
  Users,
  Plus,
  Utensils,
  Receipt,
  Eye,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface TableWithActiveOrder extends DiningTable {
  activeOrder?: (Order & { items: OrderItem[] }) | null;
}

interface TableGridProps {
  tables: TableWithActiveOrder[];
}

export function TableGrid({ tables }: TableGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"ALL" | "AVAILABLE" | "OCCUPIED" | "READY">("ALL");

  const counts = useMemo(() => {
    let available = 0;
    let occupied = 0;
    let ready = 0;

    for (const t of tables) {
      if (!t.activeOrder) available++;
      else {
        occupied++;
        if (t.activeOrder.status === "READY") ready++;
      }
    }
    return { all: tables.length, available, occupied, ready };
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (filter === "AVAILABLE") return !t.activeOrder;
      if (filter === "OCCUPIED") return !!t.activeOrder;
      if (filter === "READY") return t.activeOrder?.status === "READY";
      return true;
    });
  }, [tables, filter]);

  const handleMarkServed = (orderId: string) => {
    startTransition(async () => {
      const res = await markOrderServedAction(orderId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleRequestBill = (orderId: string) => {
    startTransition(async () => {
      const res = await requestBillAction(orderId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters & Refresh toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/80 border border-border/60 text-xs">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filter === "ALL"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Tables ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter("AVAILABLE")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filter === "AVAILABLE"
                ? "bg-card text-primary shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Available ({counts.available})
          </button>
          <button
            type="button"
            onClick={() => setFilter("OCCUPIED")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filter === "OCCUPIED"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Occupied ({counts.occupied})
          </button>
          {counts.ready > 0 && (
            <button
              type="button"
              onClick={() => setFilter("READY")}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                filter === "READY"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-primary bg-primary/10 hover:bg-primary/20 font-semibold"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Ready ({counts.ready})</span>
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
          disabled={isPending}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary self-end sm:self-auto"
        >
          <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
          <span>Refresh Floor</span>
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredTables.map((table) => {
          const activeOrder = table.activeOrder;
          const isOccupied = !!activeOrder;
          const isReady = activeOrder?.status === "READY";
          const isServed = activeOrder?.status === "SERVED";
          const isBillRequested = activeOrder?.status === "BILL_REQUESTED";

          return (
            <Card
              key={table.id}
              className={`relative overflow-hidden transition-all duration-150 border rounded-xl ${
                !isOccupied
                  ? "border-border/70 bg-card hover:border-primary/50 hover:shadow-xs"
                  : isReady
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                  : isServed
                  ? "border-chart-2/40 bg-chart-2/10"
                  : isBillRequested
                  ? "border-chart-5/40 bg-chart-5/10"
                  : "border-chart-3/40 bg-chart-3/10"
              }`}
            >
              <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs select-none ${
                      !isOccupied
                        ? "bg-muted text-muted-foreground border border-border"
                        : isReady
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {table.label}
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground leading-tight">
                      Table {table.label}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Users className="h-3 w-3" />
                      <span>{table.capacity} seats</span>
                    </div>
                  </div>
                </div>

                {isOccupied && activeOrder ? (
                  <StatusBadge status={activeOrder.status} size="sm" />
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/25">
                    Empty
                  </span>
                )}
              </CardHeader>

              <CardContent className="p-3.5 pt-1 space-y-2.5">
                {isOccupied && activeOrder ? (
                  <div className="space-y-2 border-t border-border/50 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground">
                        Order #{activeOrder.orderNumber}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatElapsedTime(activeOrder.sentAt || activeOrder.createdAt)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{activeOrder.items?.length || 0} items</span>
                      <span className="font-bold text-foreground font-mono">
                        {formatCurrency(activeOrder.total)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex flex-col gap-1.5">
                      {isReady && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkServed(activeOrder.id)}
                          disabled={isPending}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-7 gap-1 shadow-xs"
                        >
                          <Utensils className="h-3 w-3" />
                          <span>Mark Served</span>
                        </Button>
                      )}

                      {isServed && (
                        <Button
                          size="sm"
                          onClick={() => handleRequestBill(activeOrder.id)}
                          disabled={isPending}
                          className="w-full bg-chart-5 hover:bg-chart-5/90 text-primary-foreground font-semibold text-xs h-7 gap-1 shadow-xs"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>Request Bill</span>
                        </Button>
                      )}

                      <Link href={`/captain/orders/${activeOrder.id}`} className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-7 gap-1 text-muted-foreground hover:text-foreground border-border/80"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Ticket</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <Link href={`/captain/orders/new?tableId=${table.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-primary hover:bg-primary/10 hover:text-primary border-primary/30 text-xs h-7 gap-1 font-semibold"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Take Order</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

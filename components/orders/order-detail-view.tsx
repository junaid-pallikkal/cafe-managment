"use client";

import React, { useState, useTransition } from "react";
import { Order, OrderItem, DiningTable } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { markOrderServedAction, requestBillAction, cancelOrderAction } from "@/server/actions/order-actions";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime, formatElapsedTime } from "@/lib/formatters/date";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Utensils,
  Receipt,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface FullOrder extends Order {
  table: DiningTable | null;
  createdBy: { id: string; name: string; role: string };
  items: OrderItem[];
}

interface OrderDetailViewProps {
  order: FullOrder;
  userRole?: string;
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMarkServed = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await markOrderServedAction(order.id);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const handleRequestBill = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await requestBillAction(order.id);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      setErrorMessage("Please provide a reason for cancelling this order.");
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const res = await cancelOrderAction(order.id, cancelReason);
      if (res.success) {
        setCancelModalOpen(false);
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const isReady = order.status === "READY";
  const isServed = order.status === "SERVED";
  const isPaid = order.status === "PAID";
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Link href="/captain">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground leading-tight">
                Order #{order.orderNumber}
              </h1>
              <StatusBadge status={order.status} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.type === "DINE_IN" ? `Table ${order.table?.label || "--"}` : "Takeaway Order"} • Created by {order.createdBy.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            disabled={isPending}
            className="gap-1 text-xs h-8 text-muted-foreground border-border/80"
          >
            <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          {isReady && (
            <Button
              size="sm"
              onClick={handleMarkServed}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold h-8"
            >
              <Utensils className="h-3.5 w-3.5" />
              <span>Mark Served</span>
            </Button>
          )}

          {isServed && (
            <Button
              size="sm"
              onClick={handleRequestBill}
              disabled={isPending}
              className="bg-chart-5 hover:bg-chart-5/90 text-primary-foreground gap-1.5 text-xs font-semibold h-8"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Request Bill</span>
            </Button>
          )}

          {!isPaid && !isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive gap-1 text-xs h-8"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          {errorMessage}
        </div>
      )}

      {/* Order Status & Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-card p-3 rounded-xl border border-border/70 text-xs shadow-xs">
          <span className="text-muted-foreground block mb-1 text-[10px] uppercase font-semibold">Created At</span>
          <span className="font-semibold text-foreground font-mono text-[11px]">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="bg-card p-3 rounded-xl border border-border/70 text-xs shadow-xs">
          <span className="text-muted-foreground block mb-1 text-[10px] uppercase font-semibold">Sent to Kitchen</span>
          <span className="font-semibold text-foreground font-mono text-[11px]">{formatDateTime(order.sentAt)}</span>
        </div>
        <div className="bg-card p-3 rounded-xl border border-border/70 text-xs shadow-xs">
          <span className="text-muted-foreground block mb-1 text-[10px] uppercase font-semibold">Ready At</span>
          <span className="font-semibold text-foreground font-mono text-[11px]">{formatDateTime(order.readyAt)}</span>
        </div>
        <div className="bg-card p-3 rounded-xl border border-border/70 text-xs shadow-xs">
          <span className="text-muted-foreground block mb-1 text-[10px] uppercase font-semibold">Elapsed</span>
          <span className="font-bold text-primary font-mono text-[11px]">
            {formatElapsedTime(order.sentAt || order.createdAt)}
          </span>
        </div>
      </div>

      {/* Line Items Table */}
      <Card className="border-border/80 shadow-xs bg-card rounded-xl">
        <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">Ordered Items</CardTitle>
          <span className="text-[11px] text-muted-foreground font-mono">{order.items.length} total</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {order.items.map((item) => (
              <div key={item.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted text-foreground font-bold text-xs font-mono border border-border/60">
                      {item.quantity}×
                    </span>
                    <span className="font-semibold text-foreground text-xs">{item.nameSnapshot}</span>
                  </div>
                  {item.notes && (
                    <div className="text-[10px] text-chart-3 bg-chart-3/15 px-1.5 py-0.5 rounded border border-chart-3/30 inline-block">
                      Note: {item.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                  <StatusBadge status={item.status} size="sm" />
                  <span className="font-bold text-foreground font-mono">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="bg-muted/40 p-3.5 border-t border-border/70 space-y-1.5 text-xs">
            {order.notes && (
              <div className="text-muted-foreground pb-2 border-b border-border/60 text-[11px]">
                <strong className="text-foreground">Instructions:</strong> {order.notes}
              </div>
            )}
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>GST (5%)</span>
              <span className="font-mono">{formatCurrency(order.taxAmount)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-primary text-[11px]">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border/60">
              <span>Payable Total</span>
              <span className="text-primary font-mono text-base">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogHeader>
          <DialogTitle>Cancel Order #{order.orderNumber}</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this order? This action will set all items to CANCELLED and log an audit record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label className="text-xs font-semibold text-foreground">
            Mandatory Cancellation Reason:
          </label>
          <Input
            placeholder="e.g. Customer walked out, duplicate ticket entry..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="text-xs h-8 border-border/80"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCancelModalOpen(false)}
            disabled={isPending}
            className="text-xs h-8"
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelOrder}
            disabled={isPending || !cancelReason.trim()}
            className="text-xs h-8"
          >
            {isPending ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

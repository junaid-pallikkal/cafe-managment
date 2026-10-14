"use client";

import React, { useState, useTransition } from "react";
import { DiningTable, Order } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createTableAction } from "@/server/actions/admin-actions";
import { Plus, Users, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export interface TableWithOrders extends DiningTable {
  orders: Order[];
}

interface TableManagerProps {
  tables: TableWithOrders[];
}

export function TableManager({ tables }: TableManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum < 1) {
      setErrorMessage("Capacity must be at least 1 seat.");
      return;
    }

    startTransition(async () => {
      const res = await createTableAction({
        label: label.trim(),
        capacity: capNum,
      });

      if (res.success) {
        setModalOpen(false);
        setLabel("");
        setCapacity("4");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Dining Tables</h1>
          <p className="text-xs text-muted-foreground">
            Table layout configuration and floor capacity.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1 h-8 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Table</span>
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tables.map((table) => {
          const activeOrder = table.orders.find(
            (o) => !["PAID", "CANCELLED"].includes(o.status)
          );

          return (
            <Card
              key={table.id}
              className={`border rounded-xl p-3.5 flex flex-col justify-between shadow-xs transition-all ${
                activeOrder
                  ? "border-chart-3/40 bg-chart-3/10"
                  : "border-border/80 bg-card"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold text-xs select-none">
                    {table.label}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      activeOrder
                        ? "bg-chart-3/20 text-chart-3"
                        : "bg-primary/10 text-primary border border-primary/30"
                    }`}
                  >
                    {activeOrder ? "Active" : "Free"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-foreground text-xs">Table {table.label}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Users className="h-3 w-3" />
                    <span>{table.capacity} seats</span>
                  </div>
                </div>
              </div>

              {activeOrder && (
                <div className="pt-2 border-t border-border/50 mt-2 text-[10px] text-muted-foreground font-mono">
                  Order #{activeOrder.orderNumber}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Table Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>Add Dining Table</DialogTitle>
          <DialogDescription>
            Register a dining table to appear on the Captain order taking floor plan.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateTable} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Table Identifier / Label *</label>
            <Input
              required
              placeholder="e.g. T7, Balcony-1, VIP-2"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Seating Capacity *</label>
            <Input
              required
              type="number"
              min="1"
              max="20"
              placeholder="e.g. 4"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="text-xs font-mono h-8"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={isPending}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 font-semibold"
            >
              {isPending ? "Creating..." : "Save Table"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

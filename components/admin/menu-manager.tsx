"use client";

import React, { useState, useTransition } from "react";
import { MenuCategory, MenuItem } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createMenuItemAction, toggleMenuItemAvailabilityAction } from "@/server/actions/admin-actions";
import { formatCurrency } from "@/lib/formatters/currency";
import {
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

interface MenuManagerProps {
  categories: CategoryWithItems[];
}

export function MenuManager({ categories }: MenuManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [description, setDescription] = useState("");

  const handleToggleAvailability = (itemId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleMenuItemAvailabilityAction(itemId, !currentStatus);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Please enter a valid price greater than zero.");
      return;
    }

    startTransition(async () => {
      const res = await createMenuItemAction({
        name,
        price: priceNum,
        categoryId,
        description: description.trim() || undefined,
        isAvailable: true,
      });

      if (res.success) {
        setModalOpen(false);
        setName("");
        setPrice("");
        setDescription("");
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
          <h1 className="text-lg font-bold text-foreground leading-tight">Menu Catalog</h1>
          <p className="text-xs text-muted-foreground">
            Dishes, pricing, and live kitchen availability toggles.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1 h-8 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Item</span>
        </Button>
      </div>

      <div className="bg-muted/40 border border-border/80 p-2.5 rounded-lg text-[11px] text-muted-foreground flex items-start gap-2">
        <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
        <span>
          Price changes apply to new incoming orders only. Historical bills retain frozen snapshot values for audit compliance.
        </span>
      </div>

      {/* Categories & Items List */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>{cat.name}</span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-mono">
                  {cat.items.length}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {cat.items.map((item) => (
                <Card
                  key={item.id}
                  className={`border rounded-xl transition-all flex flex-col justify-between p-3.5 shadow-xs ${
                    item.isAvailable
                      ? "border-border/80 bg-card"
                      : "border-border/60 bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-xs leading-snug">{item.name}</h3>
                      <span className="font-bold text-primary text-xs font-mono whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
                    )}
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-border/50 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.isAvailable
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-destructive/10 text-destructive border border-destructive/30"
                      }`}
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-destructive" />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                      disabled={isPending}
                      className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground"
                    >
                      {item.isAvailable ? "Set Unavailable" : "Set Available"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Menu Item Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>Add Menu Item</DialogTitle>
          <DialogDescription>
            Create a new dish in the restaurant catalog.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateItem} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Dish Name *</label>
            <Input
              required
              placeholder="e.g. Malabar Fish Curry"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-border/80 bg-card text-xs text-foreground"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Price (₹) *</label>
              <Input
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="₹ 0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="text-xs font-mono h-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Description (Optional)</label>
            <Input
              placeholder="e.g. Fresh kingfish cooked with roasted spices and coconut milk"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8"
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
              {isPending ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

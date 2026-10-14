"use client";

import React, { useState, useTransition } from "react";
import { Purchase } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createPurchaseAction } from "@/server/actions/admin-actions";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface PurchaseWithActor extends Purchase {
  createdBy: { id: string; name: string };
}

interface PurchaseManagerProps {
  purchases: PurchaseWithActor[];
}

export function PurchaseManager({ purchases }: PurchaseManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState("");
  const [category, setCategory] = useState("Ingredients");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Please enter a valid purchase amount greater than zero.");
      return;
    }

    startTransition(async () => {
      const res = await createPurchaseAction({
        description,
        supplier: supplier.trim() || undefined,
        reference: reference.trim() || undefined,
        category,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit: unit.trim() || undefined,
        amount: amountNum,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setModalOpen(false);
        // Reset form
        setDescription("");
        setSupplier("");
        setReference("");
        setAmount("");
        setQuantity("");
        setNotes("");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.description.toLowerCase().includes(q) ||
      (p.supplier && p.supplier.toLowerCase().includes(q)) ||
      (p.reference && p.reference.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const totalFilteredAmount = filteredPurchases.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Supplier Purchases</h1>
          <p className="text-xs text-muted-foreground">
            Ingredients, raw stock, packaging, and supplier invoices.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1 h-8 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Purchase</span>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search supplier, item, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-card border-border/80"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border/80 bg-card text-xs text-foreground"
          >
            <option value="ALL">All Categories</option>
            <option value="Ingredients">Ingredients</option>
            <option value="Beverages">Beverages</option>
            <option value="Packaging">Packaging</option>
            <option value="Equipment">Equipment</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/80 bg-card rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-2.5 pl-3.5">Date</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Invoice</th>
                <th className="p-2.5">Qty</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5 pr-3.5">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-[11px]">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    No purchases match your criteria.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-2.5 pl-3.5 text-muted-foreground whitespace-nowrap font-mono text-[10px]">
                      {formatDateTime(p.purchasedAt)}
                    </td>
                    <td className="p-2.5 font-semibold text-foreground">{p.description}</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded font-medium bg-muted text-foreground border border-border/60 text-[10px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{p.supplier || "--"}</td>
                    <td className="p-2.5 font-mono text-muted-foreground text-[10px]">{p.reference || "--"}</td>
                    <td className="p-2.5 text-muted-foreground font-mono">
                      {p.quantity ? `${p.quantity} ${p.unit || ""}` : "--"}
                    </td>
                    <td className="p-2.5 font-bold text-foreground font-mono">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-2.5 pr-3.5 text-muted-foreground">{p.createdBy.name}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredPurchases.length > 0 && (
              <tfoot className="bg-muted/50 font-bold border-t border-border/70 text-foreground text-xs">
                <tr>
                  <td colSpan={6} className="p-2.5 pl-3.5 text-right font-medium text-muted-foreground">
                    Total:
                  </td>
                  <td colSpan={2} className="p-2.5 font-bold font-mono text-primary">
                    {formatCurrency(totalFilteredAmount)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Record Purchase Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>Record Purchase</DialogTitle>
          <DialogDescription>
            Record supplier raw materials or inventory invoice.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreatePurchase} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Description *</label>
            <Input
              required
              placeholder="e.g. Basmati Rice 25kg Bag"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Supplier Name</label>
              <Input
                placeholder="e.g. Metro Wholesale"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Invoice / Bill Ref</label>
              <Input
                placeholder="e.g. INV-2026-902"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="text-xs h-8 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-border/80 bg-card text-xs text-foreground"
              >
                <option value="Ingredients">Ingredients</option>
                <option value="Beverages">Beverages</option>
                <option value="Packaging">Packaging</option>
                <option value="Equipment">Equipment</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Quantity</label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 25"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-xs h-8 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Unit</label>
              <Input
                placeholder="kg, ltr, pcs"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Total Invoiced Amount (₹) *</label>
            <Input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="₹ 0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-xs font-mono font-bold h-8"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Notes (Optional)</label>
            <Input
              placeholder="Any details or delivery condition"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {isPending ? "Recording..." : "Record Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

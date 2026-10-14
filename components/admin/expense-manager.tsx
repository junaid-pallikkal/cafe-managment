"use client";

import React, { useState, useTransition } from "react";
import { Expense, PaymentMethod } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createExpenseAction } from "@/server/actions/admin-actions";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface ExpenseWithActor extends Expense {
  createdBy: { id: string; name: string };
}

interface ExpenseManagerProps {
  expenses: ExpenseWithActor[];
}

export function ExpenseManager({ expenses }: ExpenseManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState("Utilities");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [payee, setPayee] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Please enter a valid expense amount greater than zero.");
      return;
    }

    startTransition(async () => {
      const res = await createExpenseAction({
        category,
        description,
        amount: amountNum,
        method,
        payee: payee.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setModalOpen(false);
        setDescription("");
        setAmount("");
        setPayee("");
        setNotes("");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = categoryFilter === "ALL" || e.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      (e.payee && e.payee.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Operating Expenses</h1>
          <p className="text-xs text-muted-foreground">
            Utilities, salaries, maintenance, rent, and operational outlays.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-chart-5 hover:bg-chart-5/90 text-primary-foreground font-semibold text-xs gap-1 h-8 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Expense</span>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search description, payee..."
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
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities (Electricity/Gas)</option>
            <option value="Salaries">Staff Salaries</option>
            <option value="Maintenance">Maintenance & Repairs</option>
            <option value="Packaging">Packaging</option>
            <option value="Delivery">Delivery & Logistics</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <Card className="border-border/80 bg-card rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-2.5 pl-3.5">Date</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Payee</th>
                <th className="p-2.5">Method</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5 pr-3.5">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-[11px]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No expenses match your filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-2.5 pl-3.5 text-muted-foreground whitespace-nowrap font-mono text-[10px]">
                      {formatDateTime(exp.spentAt)}
                    </td>
                    <td className="p-2.5 font-semibold text-foreground">{exp.description}</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded font-medium bg-chart-5/15 text-chart-5 border border-chart-5/30 text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{exp.payee || "--"}</td>
                    <td className="p-2.5 font-mono text-muted-foreground text-[10px]">
                      {exp.method || "CASH"}
                    </td>
                    <td className="p-2.5 font-bold text-foreground font-mono">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="p-2.5 pr-3.5 text-muted-foreground">{exp.createdBy.name}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-muted/50 font-bold border-t border-border/70 text-foreground text-xs">
                <tr>
                  <td colSpan={5} className="p-2.5 pl-3.5 text-right font-medium text-muted-foreground">
                    Total:
                  </td>
                  <td colSpan={2} className="p-2.5 font-bold font-mono text-chart-5">
                    {formatCurrency(totalFilteredAmount)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Record Expense Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
          <DialogDescription>
            Enter expense details to record operational cash outflow.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateExpense} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Description *</label>
            <Input
              required
              placeholder="e.g. Commercial Gas Refill (2 cylinders)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-border/80 bg-card text-xs text-foreground"
              >
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities (Electricity/Gas)</option>
                <option value="Salaries">Staff Salaries</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Packaging">Packaging</option>
                <option value="Delivery">Delivery & Logistics</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Payment Channel</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full h-8 px-2.5 rounded-lg border border-border/80 bg-card text-xs text-foreground"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / QR</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other / Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Amount (₹) *</label>
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
              <label className="text-[11px] font-semibold text-foreground">Payee / Vendor</label>
              <Input
                placeholder="e.g. Indane Gas Agency"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Notes (Optional)</label>
            <Input
              placeholder="Voucher or payment reference details"
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
              className="bg-chart-5 hover:bg-chart-5/90 text-primary-foreground text-xs h-8 font-semibold"
            >
              {isPending ? "Recording..." : "Record Expense"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

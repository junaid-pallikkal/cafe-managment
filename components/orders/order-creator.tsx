"use client";

import React, { useState, useTransition, useMemo } from "react";
import { DiningTable, MenuCategory, MenuItem } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOrderAction } from "@/server/actions/order-actions";
import { formatCurrency } from "@/lib/formatters/currency";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  ShoppingBag,
  Utensils,
  StickyNote,
  AlertCircle,
  ArrowLeft,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface OrderCreatorProps {
  tables: DiningTable[];
  categories: (MenuCategory & { items: MenuItem[] })[];
  initialTableId?: string | null;
  initialType?: "DINE_IN" | "TAKEAWAY";
}

export function OrderCreator({
  tables,
  categories,
  initialTableId,
  initialType = "DINE_IN",
}: OrderCreatorProps) {
  const router = useRouter();
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">(initialType);
  const [selectedTableId, setSelectedTableId] = useState<string>(initialTableId || tables[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [orderNotes, setOrderNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered menu items
  const filteredItems = useMemo(() => {
    let allItems: MenuItem[] = [];
    if (selectedCategoryId === "ALL") {
      allItems = categories.flatMap((c) => c.items);
    } else {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      allItems = cat ? cat.items : [];
    }

    if (!searchQuery.trim()) return allItems;

    const q = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [categories, selectedCategoryId, searchQuery]);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          notes: "",
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNotes = (menuItemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, notes } : i))
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  // Financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const total = subtotal + tax;
  const totalItemCount = cart.reduce((a, b) => a + b.quantity, 0);

  const handleSubmit = () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage("Please select at least one menu item.");
      return;
    }

    if (orderType === "DINE_IN" && !selectedTableId) {
      setErrorMessage("Please select a dining table.");
      return;
    }

    startTransition(async () => {
      const payload = {
        type: orderType,
        tableId: orderType === "DINE_IN" ? selectedTableId : null,
        notes: orderNotes.trim() || null,
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes.trim() || undefined,
        })),
      };

      const res = await createOrderAction(payload);
      if (res.success) {
        router.push(`/captain/orders/${res.data.orderId}`);
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Type Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Link href="/captain">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Create Order</h1>
            <p className="text-xs text-muted-foreground">Select items and submit directly to kitchen</p>
          </div>
        </div>

        {/* Minimal Type Toggle */}
        <div className="inline-flex rounded-lg border border-border/80 bg-muted/80 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setOrderType("DINE_IN")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              orderType === "DINE_IN"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Dine-In</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType("TAKEAWAY")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              orderType === "TAKEAWAY"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Takeaway</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-destructive hover:opacity-80">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Menu Browser (Left) & Order Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Menu Section */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Table Selector if Dine-in */}
          {orderType === "DINE_IN" && (
            <div className="bg-card p-3.5 rounded-xl border border-border/70 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Dining Table:
                </span>
                <span className="text-xs text-muted-foreground">
                  {tables.find((t) => t.id === selectedTableId)?.capacity || 0} seats
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                {tables.map((table) => {
                  const isSelected = selectedTableId === table.id;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setSelectedTableId(table.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                          : "bg-muted/50 text-foreground border-border/70 hover:bg-muted hover:border-border"
                      }`}
                    >
                      <span className="font-bold text-sm leading-none">{table.label}</span>
                      <span className="text-[9px] opacity-75 mt-0.5">{table.capacity}p</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Categories */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-card text-xs border-border/80"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategoryId === "ALL"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "bg-card text-muted-foreground border border-border/70 hover:bg-muted"
                }`}
              >
                All Dishes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategoryId === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-card text-muted-foreground border border-border/70 hover:bg-muted"
                  }`}
                >
                  {cat.name} ({cat.items.length})
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const inCart = cart.find((i) => i.menuItemId === item.id);
              return (
                <Card
                  key={item.id}
                  className={`border transition-all flex flex-col justify-between p-3.5 rounded-xl ${
                    inCart
                      ? "border-primary/50 bg-primary/10 shadow-xs"
                      : "border-border/70 bg-card hover:border-border"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground text-xs leading-snug">
                        {item.name}
                      </h4>
                      <span className="font-bold text-foreground text-xs whitespace-nowrap font-mono">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
                    )}
                  </div>

                  <div className="pt-2.5 flex items-center justify-end">
                    {inCart ? (
                      <div className="inline-flex items-center gap-1 bg-card rounded-lg p-0.5 border border-primary/50 shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-6 w-6 rounded text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-bold text-xs px-2 text-primary font-mono">
                          {inCart.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-6 w-6 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item)}
                        className="h-7 text-xs px-2.5 border-border/80 hover:border-primary/50 hover:bg-primary/10 hover:text-primary text-foreground gap-1 font-semibold"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Order Cart (Right Panel) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-16">
          <Card className="border-border/80 shadow-xs bg-card rounded-xl">
            <CardHeader className="p-4 pb-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Current Order</CardTitle>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {orderType === "DINE_IN" ? (
                    <span>
                      Table: <strong>{tables.find((t) => t.id === selectedTableId)?.label || "None"}</strong>
                    </span>
                  ) : (
                    <span>Takeaway Counter</span>
                  )}
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-xs">
                  Cart is empty. Tap &quot;+ Add&quot; on dishes to start.
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="p-2.5 rounded-lg border border-border/60 bg-muted/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground leading-tight">{item.name}</span>
                        <span className="font-bold text-foreground font-mono">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1 bg-card border border-border/70 rounded-md p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                            className="h-5 w-5 rounded text-muted-foreground hover:bg-muted flex items-center justify-center"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="text-xs font-bold px-1.5 font-mono">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                            className="h-5 w-5 rounded text-muted-foreground hover:bg-muted flex items-center justify-center"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Notes (e.g. less salt)..."
                        value={item.notes}
                        onChange={(e) => updateItemNotes(item.menuItemId, e.target.value)}
                        className="w-full text-[10px] h-5 px-1.5 rounded border border-border/60 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Order Notes */}
              <div className="pt-2 border-t border-border/50 space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <StickyNote className="h-3 w-3" />
                  <span>Kitchen Instructions</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for the chefs..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border/80 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-border/70 space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>GST (5%)</span>
                  <span className="font-mono">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-foreground pt-1 border-t border-border/60">
                  <span>Estimated Total</span>
                  <span className="text-primary font-mono text-sm">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || cart.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 text-xs shadow-xs gap-1.5"
              >
                {isPending ? (
                  "Sending to Kitchen..."
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Order to Kitchen</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

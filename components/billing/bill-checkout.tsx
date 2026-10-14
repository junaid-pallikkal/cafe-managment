"use client";

import React, { useState, useTransition } from "react";
import { Order, OrderItem, DiningTable, Payment, PaymentMethod } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { recordPaymentAction } from "@/server/actions/billing-actions";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle,
  Printer,
  ArrowLeft,
  AlertCircle,
  Calculator,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface BillOrder extends Order {
  table: DiningTable | null;
  createdBy: { id: string; name: string; role: string };
  items: OrderItem[];
  payments: (Payment & { cashier: { id: string; name: string } })[];
}

interface BillCheckoutProps {
  order: BillOrder;
  cashierName: string;
}

export function BillCheckout({ order, cashierName }: BillCheckoutProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const existingPayment = order.payments[0] || null;
  const isAlreadyPaid = order.status === "PAID" || !!existingPayment;

  // Change calculation
  const totalAmount = Number(order.total);
  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);

  const handleSettlePayment = () => {
    setErrorMessage(null);

    if (paymentMethod === PaymentMethod.CASH && tenderedNum > 0 && tenderedNum < totalAmount) {
      setErrorMessage("Tendered amount cannot be less than the bill total.");
      return;
    }

    startTransition(async () => {
      const res = await recordPaymentAction({
        orderId: order.id,
        method: paymentMethod,
        amountTendered: tenderedNum || undefined,
        reference: reference.trim() || undefined,
      });

      if (res.success) {
        setReceiptModalOpen(true);
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <Link href="/billing">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground leading-tight">
                Checkout #{order.orderNumber}
              </h1>
              <StatusBadge status={order.status} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.type === "DINE_IN" ? `Table ${order.table?.label || "--"}` : "Takeaway Order"} • Cashier: {cashierName}
            </p>
          </div>
        </div>

        {isAlreadyPaid && (
          <Button
            size="sm"
            onClick={() => setReceiptModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold h-8"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Tax Receipt</span>
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Itemized Bill (Left) and Payment Panel (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Itemized Order Summary */}
        <div className="md:col-span-7 space-y-3.5">
          <Card className="border-border/80 bg-card rounded-xl shadow-xs">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                Itemized Ticket Details
              </CardTitle>
              <span className="text-[11px] text-muted-foreground font-mono">{order.items.length} items</span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">
                        {item.quantity}× {item.nameSnapshot}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        @ {formatCurrency(item.unitPrice)} each
                      </div>
                      {item.notes && (
                        <div className="text-[10px] text-chart-3 italic">Note: {item.notes}</div>
                      )}
                    </div>
                    <div className="font-bold text-foreground font-mono">
                      {formatCurrency(Number(item.unitPrice) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Authoritative Financial Breakdown */}
              <div className="bg-muted/40 p-3.5 border-t border-border/70 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>GST Tax (5%)</span>
                  <span className="font-mono">{formatCurrency(order.taxAmount)}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-primary text-[11px]">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-foreground pt-1.5 border-t border-border/60">
                  <span>Payable Total</span>
                  <span className="text-primary font-mono text-base">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Settlement Action Panel */}
        <div className="md:col-span-5">
          <Card className="border-border/80 shadow-xs bg-card rounded-xl">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/60">
              <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-primary" />
                <span>{isAlreadyPaid ? "Settlement Recorded" : "Settle Bill"}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3.5 space-y-3.5">
              {isAlreadyPaid && existingPayment ? (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Payment Confirmed</span>
                  </div>
                  <div className="space-y-1 text-foreground text-[11px] border-t border-primary/20 pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt No:</span>
                      <span className="font-mono font-semibold">{existingPayment.receiptNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel:</span>
                      <span className="font-semibold">{existingPayment.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono font-bold text-primary">{formatCurrency(existingPayment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDateTime(existingPayment.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setReceiptModalOpen(true)}
                    variant="outline"
                    className="w-full text-primary hover:bg-primary/20 hover:text-primary border-primary/40 font-semibold text-xs h-8 gap-1.5 mt-1"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>View / Print Receipt</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Payment Channel:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === PaymentMethod.CASH
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/50 text-foreground border-border/70 hover:bg-muted"
                        }`}
                      >
                        <Banknote className="h-3.5 w-3.5" />
                        <span>Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod(PaymentMethod.UPI)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === PaymentMethod.UPI
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/50 text-foreground border-border/70 hover:bg-muted"
                        }`}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>UPI / QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === PaymentMethod.CARD
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/50 text-foreground border-border/70 hover:bg-muted"
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Card (POS)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod(PaymentMethod.OTHER)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === PaymentMethod.OTHER
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/50 text-foreground border-border/70 hover:bg-muted"
                        }`}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>Other</span>
                      </button>
                    </div>
                  </div>

                  {/* Cash Change Calculator */}
                  {paymentMethod === PaymentMethod.CASH && (
                    <div className="p-3 bg-muted/50 rounded-xl border border-border/70 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                          <Calculator className="h-3 w-3 text-primary" />
                          <span>Tendered:</span>
                        </span>
                        <div className="flex gap-1">
                          {[500, 1000, 2000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setAmountTendered(amt.toString())}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-card border border-border/80 hover:bg-muted font-mono"
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Input
                        type="number"
                        placeholder={`Min ${formatCurrency(order.total)}`}
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                        className="bg-card text-xs h-8 border-border/80 font-mono"
                      />
                      {tenderedNum > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold pt-1 text-primary">
                          <span className="text-[11px]">Change Due:</span>
                          <span className="text-xs font-bold font-mono">{formatCurrency(changeDue)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reference for UPI/Card */}
                  {paymentMethod !== PaymentMethod.CASH && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        UTR / Transaction Ref (Optional):
                      </label>
                      <Input
                        placeholder="e.g. UPI-928374928"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="text-xs h-8 bg-card border-border/80 font-mono"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="button"
                    onClick={handleSettlePayment}
                    disabled={isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 text-xs shadow-xs gap-1.5"
                  >
                    {isPending ? (
                      "Recording Payment..."
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Settle {formatCurrency(order.total)}</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogHeader>
          <DialogTitle>Tax Invoice / Receipt</DialogTitle>
          <DialogDescription>
            Official customer tax receipt and payment confirmation.
          </DialogDescription>
        </DialogHeader>

        {/* Thermal Receipt Layout */}
        <div id="printable-receipt" className="border border-border/80 bg-card p-5 rounded-lg text-xs space-y-3 font-mono">
          <div className="text-center space-y-0.5 border-b border-dashed border-border pb-2.5">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
              Emerald Restaurant & Cafe
            </h2>
            <p className="text-[10px] text-muted-foreground">
              123 High Street, City Center • GSTIN: 29ABCDE1234F1Z5
            </p>
            <p className="text-[10px] text-muted-foreground">Tel: +91 98765 43210</p>
          </div>

          <div className="space-y-1 text-[11px] text-muted-foreground border-b border-dashed border-border pb-2">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <strong className="text-foreground">{existingPayment?.receiptNo || "PENDING"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Order No:</span>
              <strong className="text-foreground">#{order.orderNumber} ({order.type})</strong>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <strong className="text-foreground">{order.table?.label ? `Table ${order.table.label}` : "Takeaway"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{existingPayment?.cashier?.name || cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDateTime(existingPayment?.createdAt || new Date())}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1 border-b border-dashed border-border pb-2 text-[11px]">
            <div className="flex justify-between font-bold text-foreground pb-0.5">
              <span>Item</span>
              <span>Qty × Rate</span>
              <span>Amt</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-foreground">
                <span className="truncate max-w-[140px]">{item.nameSnapshot}</span>
                <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                <span className="font-semibold">{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-border pb-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (5%):</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-black text-xs text-foreground pt-1">
              <span>Grand Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-0.5">
              <span>Payment Channel:</span>
              <span className="font-semibold text-primary">{existingPayment?.method || paymentMethod}</span>
            </div>
          </div>

          <div className="text-center pt-1 text-[10px] text-muted-foreground">
            <p className="font-semibold text-foreground">Thank you for dining with us!</p>
            <p>Please visit again.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReceiptModalOpen(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs h-8"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Receipt</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

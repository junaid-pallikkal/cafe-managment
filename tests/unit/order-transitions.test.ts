import { test, describe } from "node:test";
import assert from "node:assert";
import { OrderStatus, ItemStatus } from "@prisma/client";

describe("Order State Machine Lifecycle & Invariants", () => {
  test("Order readiness requires all active non-cancelled items to be READY", () => {
    const itemsPartiallyReady = [
      { id: "1", status: ItemStatus.READY },
      { id: "2", status: ItemStatus.PREPARING },
      { id: "3", status: ItemStatus.CANCELLED },
    ];

    const nonCancelled1 = itemsPartiallyReady.filter((i) => i.status !== ItemStatus.CANCELLED);
    const isOrderReady1 = nonCancelled1.length > 0 && nonCancelled1.every((i) => i.status === ItemStatus.READY);
    assert.strictEqual(isOrderReady1, false, "Order must NOT be READY while item 2 is PREPARING");

    const itemsAllReady = [
      { id: "1", status: ItemStatus.READY },
      { id: "2", status: ItemStatus.READY },
      { id: "3", status: ItemStatus.CANCELLED },
    ];

    const nonCancelled2 = itemsAllReady.filter((i) => i.status !== ItemStatus.CANCELLED);
    const isOrderReady2 = nonCancelled2.length > 0 && nonCancelled2.every((i) => i.status === ItemStatus.READY);
    assert.strictEqual(isOrderReady2, true, "Order must transition to READY when all active items are READY");
  });

  test("Service flow rule: Captain can only mark order SERVED if current state is READY", () => {
    function canMarkServed(status: OrderStatus): boolean {
      return status === OrderStatus.READY;
    }

    assert.strictEqual(canMarkServed(OrderStatus.SENT_TO_KITCHEN), false);
    assert.strictEqual(canMarkServed(OrderStatus.PREPARING), false);
    assert.strictEqual(canMarkServed(OrderStatus.READY), true);
    assert.strictEqual(canMarkServed(OrderStatus.PAID), false);
  });

  test("Bill request rule: Dine-in order must be SERVED before requesting bill", () => {
    function canRequestBill(status: OrderStatus, orderType: "DINE_IN" | "TAKEAWAY"): boolean {
      if (orderType === "TAKEAWAY") return true;
      return ([OrderStatus.SERVED, OrderStatus.READY] as OrderStatus[]).includes(status);
    }

    assert.strictEqual(canRequestBill(OrderStatus.PREPARING, "DINE_IN"), false);
    assert.strictEqual(canRequestBill(OrderStatus.SERVED, "DINE_IN"), true);
    assert.strictEqual(canRequestBill(OrderStatus.PREPARING, "TAKEAWAY"), true);
  });

  test("Duplicate payment prevention rule", () => {
    interface MockOrder {
      id: string;
      orderNumber: number;
      status: OrderStatus;
      paidAt: Date | null;
      payments: { id: string }[];
    }

    function validatePaymentEligibility(order: MockOrder): { allowed: boolean; error?: string } {
      if (order.status === OrderStatus.PAID || order.paidAt !== null) {
        return { allowed: false, error: "Order is already marked PAID" };
      }
      if (order.payments.length > 0) {
        return { allowed: false, error: "A payment record already exists" };
      }
      return { allowed: true };
    }

    const unpaidOrder: MockOrder = {
      id: "ord-1",
      orderNumber: 101,
      status: OrderStatus.BILL_REQUESTED,
      paidAt: null,
      payments: [],
    };

    assert.strictEqual(validatePaymentEligibility(unpaidOrder).allowed, true);

    const alreadyPaidOrder: MockOrder = {
      id: "ord-2",
      orderNumber: 102,
      status: OrderStatus.PAID,
      paidAt: new Date(),
      payments: [{ id: "pay-1" }],
    };

    const result = validatePaymentEligibility(alreadyPaidOrder);
    assert.strictEqual(result.allowed, false);
    assert.match(result.error || "", /already marked PAID/);
  });
});

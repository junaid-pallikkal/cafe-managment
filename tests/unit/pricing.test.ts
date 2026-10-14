import { test, describe } from "node:test";
import assert from "node:assert";
import { formatCurrency, toNumber } from "@/lib/formatters/currency";
import { Decimal } from "@prisma/client/runtime/library";

describe("Pricing and Financial Calculation Tests", () => {
  test("Subtotal is calculated correctly from quantity and unit price", () => {
    const items = [
      { unitPrice: new Decimal("180.00"), quantity: 2 }, // 360
      { unitPrice: new Decimal("240.00"), quantity: 1 }, // 240
      { unitPrice: new Decimal("25.00"), quantity: 4 },  // 100
    ];

    let subtotal = new Decimal(0);
    for (const item of items) {
      subtotal = subtotal.add(item.unitPrice.mul(item.quantity));
    }

    assert.strictEqual(subtotal.toString(), "700");
  });

  test("GST 5% tax and grand total calculation", () => {
    const subtotal = new Decimal("700.00");
    const taxRate = new Decimal("0.05");
    const taxAmount = subtotal.mul(taxRate).toDecimalPlaces(2);
    const discount = new Decimal("0.00");
    const serviceCharge = new Decimal("0.00");

    const total = subtotal.sub(discount).add(taxAmount).add(serviceCharge).toDecimalPlaces(2);

    assert.strictEqual(taxAmount.toString(), "35");
    assert.strictEqual(total.toString(), "735");
  });

  test("Currency formatter handles Decimal, numbers, and strings accurately", () => {
    assert.strictEqual(formatCurrency(735), "₹735.00");
    assert.strictEqual(formatCurrency("180.50"), "₹180.50");
    assert.strictEqual(formatCurrency(new Decimal("240.00")), "₹240.00");
    assert.strictEqual(formatCurrency(null), "₹0.00");
    assert.strictEqual(formatCurrency(undefined), "₹0.00");
  });

  test("toNumber safely converts values without NaN", () => {
    assert.strictEqual(toNumber(new Decimal("99.99")), 99.99);
    assert.strictEqual(toNumber("123.45"), 123.45);
    assert.strictEqual(toNumber(null), 0);
  });
});

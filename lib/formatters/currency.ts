import { Decimal } from "@prisma/client/runtime/library";

/**
 * Formats a numeric value, Decimal, or string as INR currency (₹).
 */
export function formatCurrency(amount: number | string | Decimal | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "₹0.00";
  }

  const num = typeof amount === "number" 
    ? amount 
    : typeof amount === "string" 
      ? parseFloat(amount) 
      : Number(amount);

  if (isNaN(num)) return "₹0.00";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Safely converts Decimal, string, or number to a fixed 2-decimal number.
 */
export function toNumber(value: number | string | Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return Number(value);
}

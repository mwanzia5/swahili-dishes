import { ReadonlyURLSearchParams } from "next/navigation";

export const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;
  return `${pathname}${queryString}`;
};

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith) ? stringToCheck : `${startsWith}${stringToCheck}`;

/**
 * Format a KES price string into a human-readable amount.
 * Example: formatPrice("650") → "KES 650"
 */
export function formatPrice(amount: string | number, currency = "KES"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currency} 0`;
  return `${currency} ${num.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format an ISO timestamp into a short readable date.
 * Example: formatDate("2026-01-05T10:00:00Z") → "5 Jan 2026"
 */
export function formatDate(value: string | number | Date): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculate cart totals from a list of line items.
 */
export function calculateCartTotals(
  items: { quantity: number; unit_price: string }[],
  deliveryFee = 0,
  discount = 0,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.unit_price) * item.quantity,
    0,
  );
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return {
    subtotal: subtotal.toFixed(2),
    delivery_fee: deliveryFee.toFixed(2),
    discount: discount.toFixed(2),
    total: total.toFixed(2),
  };
}
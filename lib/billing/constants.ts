/** Display and default invoice amount (USD). Optional server override: `PRO_PRICE_USD`. */
export const PRO_PRICE_USD = 11.99;

export function getInvoicePriceUsd(): number {
  const raw = (process.env.PRO_PRICE_USD ?? process.env.PRO_MONTHLY_PRICE ?? "").trim();
  if (!raw) return PRO_PRICE_USD;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : PRO_PRICE_USD;
}

export type SubscriptionStatus = "free" | "pro";

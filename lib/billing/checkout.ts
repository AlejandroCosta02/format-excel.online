import { PRO_PRICE_USD } from "@/lib/billing/constants";

export function getProPriceLabel(): string {
  const formatted = Number.isInteger(PRO_PRICE_USD)
    ? String(PRO_PRICE_USD)
    : PRO_PRICE_USD.toFixed(2);
  return `$${formatted}`;
}

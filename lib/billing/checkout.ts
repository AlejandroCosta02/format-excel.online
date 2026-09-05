import { PRO_MONTHLY_USD } from "@/lib/billing/constants";

export function getProPriceLabel(): string {
  const formatted = Number.isInteger(PRO_MONTHLY_USD)
    ? String(PRO_MONTHLY_USD)
    : PRO_MONTHLY_USD.toFixed(2);
  return `$${formatted}/mes`;
}

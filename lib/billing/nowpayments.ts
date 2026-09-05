import { createHmac, timingSafeEqual } from "node:crypto";

export type NowPaymentsIpn = {
  payment_status?: string;
  payment_id?: number | string;
  invoice_id?: number | string;
  order_id?: string;
  price_amount?: number;
  price_currency?: string;
  pay_currency?: string;
};

export function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject(record[key]);
        return acc;
      }, {});
  }
  return value;
}

export function verifyNowPaymentsSignature(
  payload: unknown,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const digest = createHmac("sha512", secret)
    .update(JSON.stringify(sortObject(payload)))
    .digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isPaymentFinished(status: string | undefined): boolean {
  return (status ?? "").toLowerCase() === "finished";
}

import { createHmac, timingSafeEqual } from "node:crypto";

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    attributes?: {
      status?: string;
      customer_id?: number | string;
      user_email?: string;
      checkout_data?: {
        custom?: Record<string, unknown>;
      };
    };
  };
};

export function verifyLemonSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export function extractUserId(payload: LemonWebhookPayload): string | null {
  return (
    asString(payload.meta?.custom_data?.user_id) ??
    asString(payload.data?.attributes?.checkout_data?.custom?.user_id)
  );
}

export function extractCustomerId(payload: LemonWebhookPayload): string | null {
  const raw = payload.data?.attributes?.customer_id;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

export function planFromEvent(eventName: string, status: string | undefined): "pro" | "free" | null {
  const event = eventName.toLowerCase();
  const st = (status ?? "").toLowerCase();

  if (
    event === "subscription_cancelled" ||
    event === "subscription_expired" ||
    event === "subscription_payment_failed"
  ) {
    return "free";
  }

  if (event === "order_created" || event === "subscription_created") {
    return "pro";
  }

  if (event === "subscription_updated" || event === "subscription_resumed") {
    if (["cancelled", "expired", "unpaid", "past_due"].includes(st)) return "free";
    if (["active", "paid", "on_trial"].includes(st) || st === "") return "pro";
  }

  return null;
}

import { NextResponse } from "next/server";
import {
  extractCustomerId,
  extractUserId,
  planFromEvent,
  verifyLemonSignature,
  type LemonWebhookPayload,
} from "@/lib/billing/lemon-webhook";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = (process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "").trim();
  const raw = await request.text();
  const signature = request.headers.get("x-signature");

  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  if (!verifyLemonSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(raw) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? request.headers.get("x-event-name") ?? "";
  const plan = planFromEvent(eventName, payload.data?.attributes?.status);
  if (!plan) {
    return NextResponse.json({ ok: true, ignored: eventName });
  }

  const userId = extractUserId(payload);
  if (!userId) {
    return NextResponse.json({ error: "Falta user_id en custom_data" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const patch: { subscription_status: "free" | "pro"; lemon_squeezy_customer_id?: string } = {
    subscription_status: plan,
  };
  const customerId = extractCustomerId(payload);
  if (customerId) patch.lemon_squeezy_customer_id = customerId;

  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan });
}

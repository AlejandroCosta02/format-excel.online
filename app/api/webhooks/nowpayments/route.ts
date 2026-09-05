import { NextResponse } from "next/server";
import { sendWelcomeProEmail } from "@/lib/email";
import {
  isPaymentFinished,
  verifyNowPaymentsSignature,
  type NowPaymentsIpn,
} from "@/lib/billing/nowpayments";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = (process.env.NOWPAYMENTS_IPN_SECRET ?? "").trim();
  const signature = request.headers.get("x-nowpayments-sig");
  const raw = await request.text();

  let payload: NowPaymentsIpn;
  try {
    payload = JSON.parse(raw) as NowPaymentsIpn;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!secret) {
    return NextResponse.json({ error: "IPN no configurado" }, { status: 500 });
  }

  if (!verifyNowPaymentsSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (!isPaymentFinished(payload.payment_status)) {
    return NextResponse.json({ ok: true, ignored: payload.payment_status ?? "unknown" });
  }

  const userId = payload.order_id?.trim();
  if (!userId) {
    return NextResponse.json({ error: "Falta order_id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, full_name, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const alreadyPro = profile?.subscription_status === "pro";
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ subscription_status: "pro" })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!alreadyPro) {
    let email = profile?.email ?? "";
    let name = profile?.full_name ?? "";
    if (!email) {
      const { data } = await supabase.auth.admin.getUserById(userId);
      email = data.user?.email ?? "";
      name =
        name ||
        (data.user?.user_metadata?.full_name as string | undefined) ||
        "";
    }
    if (email) {
      try {
        await sendWelcomeProEmail(email, name);
      } catch {
        // El plan ya está activo; no fallar el IPN por el correo.
      }
    }
  }

  return NextResponse.json({ ok: true, plan: "pro" });
}

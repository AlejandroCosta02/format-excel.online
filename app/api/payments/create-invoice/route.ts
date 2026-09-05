import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/billing/app-url";
import { PRO_MONTHLY_USD } from "@/lib/billing/constants";
import { createClient } from "@/lib/supabase/server";

type NowPaymentsInvoiceResponse = {
  id?: string | number;
  invoice_url?: string;
  message?: string;
};

export async function POST() {
  const apiKey = (process.env.NOWPAYMENTS_API_KEY ?? "").trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Falta NOWPAYMENTS_API_KEY" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const appUrl = getAppUrl();
  const payCurrency = (process.env.NOWPAYMENTS_PAY_CURRENCY ?? "").trim();
  const body: Record<string, string | number> = {
    price_amount: Number(PRO_MONTHLY_USD.toFixed(2)),
    price_currency: "USD",
    order_id: user.id,
    order_description: "formatexcel.online PRO",
    ipn_callback_url: `${appUrl}/api/webhooks/nowpayments`,
    success_url: `${appUrl}/payment/success?session_id={invoice_id}`,
    cancel_url: `${appUrl}/`,
  };
  if (payCurrency) body.pay_currency = payCurrency;

  const response = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let payload: NowPaymentsInvoiceResponse = {};
  try {
    payload = JSON.parse(raw) as NowPaymentsInvoiceResponse;
  } catch {
    return NextResponse.json({ error: "Respuesta inválida de NOWPayments" }, { status: 502 });
  }
  if (!response.ok || !payload.invoice_url) {
    return NextResponse.json(
      { error: payload.message ?? "NOWPayments no devolvió invoice_url" },
      { status: 502 },
    );
  }

  return NextResponse.json({ invoice_url: payload.invoice_url, invoice_id: payload.id ?? null });
}

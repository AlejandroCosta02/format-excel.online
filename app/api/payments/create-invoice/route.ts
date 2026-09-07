import { NextResponse } from "next/server";
import { absoluteAppUrl } from "@/lib/billing/app-url";
import { getInvoicePriceUsd } from "@/lib/billing/constants";
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

  let success_url: string;
  let cancel_url: string;
  let ipn_callback_url: string;
  try {
    success_url = absoluteAppUrl("/payment/success");
    cancel_url = absoluteAppUrl("/");
    ipn_callback_url = absoluteAppUrl("/api/webhooks/nowpayments");
    for (const uri of [success_url, cancel_url, ipn_callback_url]) {
      const parsed = new URL(uri);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(uri);
      }
    }
  } catch {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL debe ser una URL absoluta (https://formatexcel.online)" },
      { status: 500 },
    );
  }

  const payCurrency = (process.env.NOWPAYMENTS_PAY_CURRENCY ?? "").trim();
  const body: Record<string, string | number> = {
    price_amount: Number(getInvoicePriceUsd().toFixed(2)),
    price_currency: "USD",
    order_id: user.id,
    order_description: "formatExcel. PRO",
    ipn_callback_url,
    success_url,
    cancel_url,
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

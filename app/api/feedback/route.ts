import { NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_LEN = 200;
const MAX_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;
const TOOLS = new Set(["formatter", "mail-merge", "manifest", "templates"]);

const buckets = new Map<string, number[]>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  return ip.slice(0, 80);
}

function allowRequest(key: string): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_PER_HOUR) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function POST(request: Request) {
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json({ error: "Demasiados envíos. Prueba más tarde." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const message = asTrimmedString(raw.message, MAX_LEN);
  if (!message || message.length < 1) {
    return NextResponse.json({ error: "El mensaje debe tener entre 1 y 200 caracteres." }, { status: 400 });
  }

  const pathRaw = asTrimmedString(raw.path, 300);
  const path = pathRaw && pathRaw.startsWith("/") && !pathRaw.includes("\n") ? pathRaw : null;

  const toolRaw = typeof raw.tool === "string" ? raw.tool.trim() : "";
  const tool = TOOLS.has(toolRaw) ? toolRaw : null;

  const localeRaw = typeof raw.locale === "string" ? raw.locale.trim() : "";
  const locale = localeRaw === "en" || localeRaw === "es" ? localeRaw : null;

  let userId: string | null = null;
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el feedback." }, { status: 500 });
  }
  const { error } = await supabase.from("feedback").insert({
    message,
    path,
    tool,
    locale,
    user_id: userId,
  });

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar el feedback." }, { status: 500 });
  }

  try {
    await sendFeedbackEmail({ message, path, tool, locale, userId });
  } catch {
    // Persist even if email delivery fails.
  }

  return NextResponse.json({ ok: true });
}

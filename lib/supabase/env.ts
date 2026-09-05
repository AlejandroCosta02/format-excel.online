function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/** Project URL only — not the Data API path `/rest/v1`. */
function normalizeSupabaseUrl(value: string): string {
  return stripQuotes(value)
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

export function getSupabasePublicEnv() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const anonKey = stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
  return {
    url,
    anonKey,
    isConfigured: url.startsWith("https://") && url.includes(".supabase.co") && anonKey.length > 20,
  };
}

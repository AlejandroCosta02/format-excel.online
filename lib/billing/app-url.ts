export function getAppUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
  if (fromEnv.startsWith("http")) return fromEnv;
  return "http://localhost:3000";
}

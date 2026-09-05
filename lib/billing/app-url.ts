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

export function getAppUrl(): string {
  const raw = stripQuotes(process.env.NEXT_PUBLIC_APP_URL || "https://formatexcel.online");
  const withProtocol = /^(https?:)\/\//i.test(raw) ? raw : `https://${raw}`;
  const origin = withProtocol.replace(/\/+$/, "");
  return new URL(origin).origin;
}

export function absoluteAppUrl(path: string): string {
  return new URL(path, `${getAppUrl()}/`).toString();
}

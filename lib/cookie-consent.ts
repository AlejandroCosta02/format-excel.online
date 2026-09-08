export const COOKIE_CONSENT_KEY = "formatexcel:cookie-consent";
export const COOKIE_CONSENT_EVENT = "formatexcel-cookie-consent";
export const COOKIE_SETTINGS_OPEN_EVENT = "formatexcel-cookie-settings";

export type CookieConsent = {
  analytics: boolean;
  decidedAt: number;
};

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (typeof parsed.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(analytics: boolean): CookieConsent {
  const next: CookieConsent = { analytics, decidedAt: Date.now() };
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: next }));
  return next;
}

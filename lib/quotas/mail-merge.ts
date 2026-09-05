import { z } from "zod";

export const MAIL_MERGE_GUEST_LIMIT = 5;
export const MAIL_MERGE_FREE_LIMIT = 10;
export const MAIL_MERGE_QUOTA_KEY_PREFIX = "excelflow:mail-merge-quota:v2";

const quotaSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  used: z.number().int().min(0),
});

export type MailMergeQuota = {
  date: string;
  used: number;
  remaining: number;
  limit: number;
  unlimited: boolean;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function mailMergeQuotaStorageKey(userId: string | null): string {
  return userId ? `${MAIL_MERGE_QUOTA_KEY_PREFIX}:user:${userId}` : `${MAIL_MERGE_QUOTA_KEY_PREFIX}:guest`;
}

function makeQuota(date: string, used: number, limit: number, unlimited: boolean): MailMergeQuota {
  if (unlimited) {
    return { date, used: 0, remaining: Number.MAX_SAFE_INTEGER, limit: Number.MAX_SAFE_INTEGER, unlimited: true };
  }
  return {
    date,
    used,
    remaining: Math.max(0, limit - used),
    limit,
    unlimited: false,
  };
}

let snapshot: MailMergeQuota | null = null;

function cacheSnapshot(next: MailMergeQuota): MailMergeQuota {
  if (
    snapshot &&
    snapshot.date === next.date &&
    snapshot.used === next.used &&
    snapshot.remaining === next.remaining &&
    snapshot.limit === next.limit &&
    snapshot.unlimited === next.unlimited
  ) {
    return snapshot;
  }
  snapshot = next;
  return snapshot;
}

export function mailMergeLimitFor(input: { userId: string | null; isPro: boolean }): number {
  if (input.isPro) return Number.MAX_SAFE_INTEGER;
  return input.userId ? MAIL_MERGE_FREE_LIMIT : MAIL_MERGE_GUEST_LIMIT;
}

export function readMailMergeQuota(input: { userId: string | null; isPro: boolean }): MailMergeQuota {
  const limit = mailMergeLimitFor(input);
  if (input.isPro) {
    return cacheSnapshot(makeQuota(todayKey(), 0, limit, true));
  }

  if (typeof window === "undefined") {
    return cacheSnapshot(makeQuota(todayKey(), 0, MAIL_MERGE_GUEST_LIMIT, false));
  }

  try {
    const raw = window.localStorage.getItem(mailMergeQuotaStorageKey(input.userId));
    if (!raw) return cacheSnapshot(makeQuota(todayKey(), 0, limit, false));
    const parsed = quotaSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return cacheSnapshot(makeQuota(todayKey(), 0, limit, false));
    if (parsed.data.date !== todayKey()) return cacheSnapshot(makeQuota(todayKey(), 0, limit, false));
    return cacheSnapshot(makeQuota(parsed.data.date, parsed.data.used, limit, false));
  } catch {
    return cacheSnapshot(makeQuota(todayKey(), 0, limit, false));
  }
}

export function consumeMailMergeQuota(
  count: number,
  input: { userId: string | null; isPro: boolean },
): MailMergeQuota {
  if (input.isPro) {
    const next = cacheSnapshot(makeQuota(todayKey(), 0, mailMergeLimitFor(input), true));
    window.dispatchEvent(new Event("excelflow:quota"));
    return next;
  }
  const current = readMailMergeQuota(input);
  const nextUsed = current.used + Math.max(0, count);
  const stored = { date: current.date, used: nextUsed };
  window.localStorage.setItem(mailMergeQuotaStorageKey(input.userId), JSON.stringify(stored));
  const next = cacheSnapshot(makeQuota(stored.date, nextUsed, current.limit, false));
  window.dispatchEvent(new Event("excelflow:quota"));
  return next;
}

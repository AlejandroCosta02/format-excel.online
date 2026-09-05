"use client";

import { useSyncExternalStore } from "react";
import {
  MAIL_MERGE_GUEST_LIMIT,
  readMailMergeQuota,
  type MailMergeQuota,
} from "@/lib/quotas/mail-merge";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("excelflow:quota", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("excelflow:quota", onStoreChange);
  };
}

const serverSnapshot: MailMergeQuota = {
  date: "1970-01-01",
  used: 0,
  remaining: MAIL_MERGE_GUEST_LIMIT,
  limit: MAIL_MERGE_GUEST_LIMIT,
  unlimited: false,
};

function getServerSnapshot() {
  return serverSnapshot;
}

export function useMailMergeQuota(userId: string | null, isPro: boolean) {
  return useSyncExternalStore(
    subscribe,
    () => readMailMergeQuota({ userId, isPro }),
    getServerSnapshot,
  );
}

"use client";

import { useAuth } from "@/components/auth-provider";
import { useMailMergeQuota } from "@/hooks/use-mail-merge-quota";

export function SiteFooter() {
  const { user, isPro } = useAuth();
  const quota = useMailMergeQuota(user?.id ?? null, isPro);

  return (
    <footer className="mt-auto border-t bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 ExcelFlow · Procesamiento en el navegador.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href="#legal" id="legal" className="hover:text-foreground">
            Aviso legal
          </a>
          <a href="#privacidad" id="privacidad" className="hover:text-foreground">
            Privacidad
          </a>
          <span>
            Mail Merge hoy:{" "}
            {isPro ? (
              <strong className="text-excel">ilimitado (Pro)</strong>
            ) : (
              <>
                <strong className="text-foreground">
                  {quota.remaining}/{quota.limit}
                </strong>{" "}
                envíos restantes
              </>
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}

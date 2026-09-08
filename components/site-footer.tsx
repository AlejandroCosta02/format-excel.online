"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/lib/i18n/provider";
import { useMailMergeQuota } from "@/hooks/use-mail-merge-quota";

export function SiteFooter() {
  const { user, isPro } = useAuth();
  const { t } = useI18n();
  const quota = useMailMergeQuota(user?.id ?? null, isPro);

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-semibold">{t.brand}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t.footer.blurb}</p>
          <p className="mt-4 text-xs text-muted-foreground">{t.footer.copyright}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t.footer.tools}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/?tool=formatter#workspace">
                {t.nav.formatter}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/?tool=manifest#workspace">
                {t.nav.manifest}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/?tool=mail-merge#workspace">
                {t.nav.mailMerge}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t.footer.support}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a className="hover:text-foreground" href="mailto:admin@formatexcel.online">
                admin@formatexcel.online
              </a>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/#faq">
                {t.footer.faq}
              </Link>
            </li>
            <li>
              {t.footer.mailQuota}:{" "}
              {isPro ? (
                <strong className="text-excel">{t.footer.unlimited}</strong>
              ) : (
                <>
                  <strong className="text-foreground">
                    {quota.remaining}/{quota.limit}
                  </strong>{" "}
                  {t.footer.remaining}
                </>
              )}
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t.footer.legal}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" href="/terms">
                {t.footer.terms}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/privacy">
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" href="/cookie-policy">
                {t.footer.cookies}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

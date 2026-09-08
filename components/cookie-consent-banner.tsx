"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COOKIE_SETTINGS_OPEN_EVENT,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function CookieConsentBanner() {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const current = readCookieConsent();
    setVisible(current === null);
    setAnalytics(current?.analytics ?? false);
    setReady(true);

    const openSettings = () => {
      setAnalytics(readCookieConsent()?.analytics ?? false);
      setSettingsOpen(true);
    };
    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings);
  }, []);

  function acceptAll() {
    writeCookieConsent(true);
    setVisible(false);
    setSettingsOpen(false);
  }

  function saveSettings() {
    writeCookieConsent(analytics);
    setVisible(false);
    setSettingsOpen(false);
  }

  if (!ready) return null;

  return (
    <>
      {visible ? (
        <div className="pointer-events-none fixed bottom-4 left-4 z-40 max-w-md">
          <div className="pointer-events-auto rounded-xl border bg-card p-4 text-sm shadow-lg ring-1 ring-foreground/10">
            <p className="leading-relaxed text-muted-foreground">{t.cookies.banner}</p>
            <p className="mt-2">
              <Link href="/cookie-policy" className="text-primary underline-offset-4 hover:underline">
                {t.cookies.policy}
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={acceptAll}>
                {t.cookies.accept}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setAnalytics(readCookieConsent()?.analytics ?? false);
                  setSettingsOpen(true);
                }}
              >
                {t.cookies.settings}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.cookies.settingsTitle}</DialogTitle>
            <DialogDescription>{t.cookies.settingsDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">{t.cookies.necessary}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.cookies.necessaryHelp}</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
              />
              <span>
                <Label className="cursor-pointer">{t.cookies.analytics}</Label>
                <p className="mt-1 text-xs text-muted-foreground">{t.cookies.analyticsHelp}</p>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button type="button" onClick={saveSettings}>
              {t.cookies.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OpenCookieSettingsButton({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT))}
    >
      {t.cookies.settings}
    </Button>
  );
}

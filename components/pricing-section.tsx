"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { getProPriceLabel } from "@/lib/billing/checkout";

export function PricingSection() {
  const { isPro, openUpgrade, user, openAuth } = useAuth();
  const { t } = useI18n();

  return (
    <section id="pricing" className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{t.pricing.title}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t.pricing.subtitle}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{t.pricing.free}</p>
          <h3 className="mt-1 text-2xl font-semibold">{t.pricing.guestHook}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t.pricing.freeFor}</p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">
            {t.pricing.freeItems.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-excel" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link href="/?tool=formatter#workspace">{t.pricing.freeCta}</Link>
          </Button>
        </div>
        <div className="flex flex-col rounded-2xl border border-primary/40 bg-gradient-to-b from-accent to-card p-6 shadow-md ring-1 ring-primary/15">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-primary">{t.pricing.pro}</p>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {t.pricing.lifetime}
            </span>
          </div>
          <h3 className="mt-1 text-2xl font-semibold">
            {getProPriceLabel()}{" "}
            <span className="text-base font-normal text-muted-foreground">{t.pricing.once}</span>
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{t.pricing.proFor}</p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">
            {t.pricing.proItems.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {isPro ? (
            <p className="mt-6 text-sm text-excel">{t.pricing.alreadyPro}</p>
          ) : (
            <Button
              type="button"
              className="mt-6 w-full"
              onClick={() => (user ? openUpgrade() : openAuth())}
            >
              {t.pricing.proCta}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

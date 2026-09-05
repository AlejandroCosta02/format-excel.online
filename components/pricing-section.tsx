"use client";

import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { getProPriceLabel } from "@/lib/billing/checkout";

export function PricingSection() {
  const { isPro, openUpgrade, user, openAuth } = useAuth();
  const { t } = useI18n();

  return (
    <section id="pricing" className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight">{t.pricing.title}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t.pricing.subtitle}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-lg font-medium">{t.pricing.free}</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
            {t.pricing.freeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-primary/30 bg-accent p-5">
          <h3 className="text-lg font-medium text-primary">{t.pricing.pro}</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
            {t.pricing.proItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {isPro ? (
            <p className="mt-4 text-sm text-excel">{t.pricing.alreadyPro}</p>
          ) : (
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={() => (user ? openUpgrade() : openAuth())}
            >
              {t.pricing.cta} ({getProPriceLabel()})
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

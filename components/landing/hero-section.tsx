"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { CompareSlider } from "@/components/landing/compare-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export function LandingHero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-blue-50/80 via-background to-background dark:from-blue-950/30">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {t.landing.h1}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t.landing.sub}
          </p>
          <div className="mt-5 inline-flex max-w-xl items-start gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{t.landing.privacyBadge}</span>
          </div>
          <div className="mt-6 flex flex-col items-start gap-3">
            <Button asChild size="lg" className="shadow-lg shadow-blue-600/20">
              <Link href="/?tool=formatter#workspace">
                {t.landing.primaryCta}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Badge variant="outline" className="font-normal">
              {t.landing.microBadge}
            </Badge>
          </div>
        </div>
        <CompareSlider />
      </div>
    </section>
  );
}

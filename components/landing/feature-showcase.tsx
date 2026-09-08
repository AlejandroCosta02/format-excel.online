"use client";

import Link from "next/link";
import { ArrowRight, FileSearch, FileSpreadsheet, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export function FeatureShowcase() {
  const { t } = useI18n();
  const steps = [t.landing.f2s1, t.landing.f2s2, t.landing.f2s3, t.landing.f2s4];

  return (
    <section className="border-b bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{t.landing.featuresTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t.landing.featuresSubtitle}</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="size-4" />
              </div>
              <CardTitle>{t.landing.f1Title}</CardTitle>
              <CardDescription>{t.landing.f1Body}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/?tool=formatter#workspace">
                  {t.landing.f1Cta}
                  <ArrowRight />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-full shadow-sm">
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSearch className="size-4" />
              </div>
              <CardTitle>{t.landing.f2Title}</CardTitle>
              <CardDescription>{t.landing.f2Body}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid grid-cols-2 gap-2 text-xs">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className="rounded-lg border bg-muted/40 px-2.5 py-2 text-muted-foreground"
                  >
                    <span className="font-semibold text-foreground">{index + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/?tool=manifest#workspace">
                  {t.landing.f2Cta}
                  <ArrowRight />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-full shadow-sm">
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="size-4" />
              </div>
              <CardTitle>{t.landing.f3Title}</CardTitle>
              <CardDescription>{t.landing.f3Body}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3 font-mono text-xs">
                <p className="text-muted-foreground line-through decoration-red-400/80">
                  {t.landing.f3Before}
                </p>
                <p className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {t.landing.f3After}
                </p>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href="/?tool=mail-merge#workspace">
                  {t.landing.f3Cta}
                  <ArrowRight />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}

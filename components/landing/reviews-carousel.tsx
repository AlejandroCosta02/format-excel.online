"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { REVIEWS } from "@/lib/reviews";

export function ReviewsCarousel() {
  const { t, locale } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [activeLocale, setActiveLocale] = useState<"en" | "es">("en");

  useEffect(() => {
    setActiveLocale(locale);
  }, [locale]);

  function scrollTo(next: number) {
    const clamped = (next + REVIEWS.length) % REVIEWS.length;
    setIndex(clamped);
    const root = scrollerRef.current;
    const child = root?.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <section className="border-b bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{t.landing.reviewsTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.landing.reviewsSubtitle}</p>

        <div className="mt-6 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t.landing.prevReview}
            onClick={() => scrollTo(index - 1)}
          >
            <ChevronLeft />
          </Button>
          <div
            ref={scrollerRef}
            className="flex min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {REVIEWS.map((review) => (
              <Card
                key={review.id}
                className="w-[min(100%,20rem)] shrink-0 snap-center shadow-sm sm:w-80"
              >
                <CardContent className="flex flex-col gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{review.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.role[activeLocale]}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-amber-500" aria-label={`${review.rating} / 5`}>
                    {Array.from({ length: 5 }, (_, star) => (
                      <Star key={star} className="size-3.5 fill-current" aria-hidden />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {review.quote[activeLocale]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t.landing.nextReview}
            onClick={() => scrollTo(index + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {REVIEWS.map((review, i) => (
            <button
              key={review.id}
              type="button"
              aria-label={`${review.name}`}
              className={`size-2 rounded-full transition-colors ${i === index ? "bg-primary" : "bg-border"}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

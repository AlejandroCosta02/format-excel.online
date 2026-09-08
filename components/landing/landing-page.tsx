"use client";

import { LandingHero } from "@/components/landing/hero-section";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { ReviewsCarousel } from "@/components/landing/reviews-carousel";
import { PricingSection } from "@/components/pricing-section";

export function LandingPage() {
  return (
    <div>
      <LandingHero />
      <FeatureShowcase />
      <ReviewsCarousel />
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <PricingSection />
      </div>
    </div>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { FeedbackWidget } from "@/components/feedback-widget";
import { I18nProvider } from "@/lib/i18n/provider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <FeedbackWidget />
            <CookieConsentBanner />
            <Toaster position="top-center" />
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

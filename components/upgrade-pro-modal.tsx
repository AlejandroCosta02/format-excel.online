"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProPriceLabel } from "@/lib/billing/checkout";
import { useI18n } from "@/lib/i18n/provider";

type UpgradeProModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onLogin: () => void;
};

export function UpgradeProModal({ open, onOpenChange, user, onLogin }: UpgradeProModalProps) {
  const { t } = useI18n();
  const price = getProPriceLabel();
  const [pending, setPending] = useState(false);

  async function subscribe() {
    if (!user) {
      onLogin();
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/payments/create-invoice", { method: "POST" });
      const payload = (await response.json()) as { invoice_url?: string; error?: string };
      if (!response.ok || !payload.invoice_url) {
        throw new Error(payload.error ?? "No se pudo crear la factura");
      }
      window.location.href = payload.invoice_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar el pago");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            {t.upgrade.title}
          </DialogTitle>
          <DialogDescription>
            {t.upgrade.desc}
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>{t.upgrade.b1}</li>
          <li>{t.upgrade.b2}</li>
          <li>{t.upgrade.b3}</li>
        </ul>
        <Button type="button" className="w-full" size="lg" onClick={() => void subscribe()} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              {t.upgrade.creating}
            </>
          ) : user ? (
            `${t.pricing.cta} · ${price}`
          ) : (
            t.upgrade.loginCta
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

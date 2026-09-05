"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TemplateRecord } from "@/lib/templates/types";

type TemplateMatchBannerProps = {
  template: TemplateRecord;
  extraCount?: number;
  onApply: () => void;
  onDismiss: () => void;
};

export function TemplateMatchBanner({
  template,
  extraCount = 0,
  onApply,
  onDismiss,
}: TemplateMatchBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-accent px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-foreground">
        <Sparkles className="mr-1 inline size-4 text-primary" />
        Detectamos que este archivo coincide con tu plantilla{" "}
        <strong>{template.title}</strong>
        {extraCount > 0 ? ` (y ${extraCount} más)` : ""}.
      </p>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          Ahora no
        </Button>
        <Button type="button" size="sm" onClick={onApply}>
          Aplicar plantilla en 1-clic
        </Button>
      </div>
    </div>
  );
}

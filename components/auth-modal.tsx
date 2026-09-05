"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { useI18n } from "@/lib/i18n/provider";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function AuthModal({
  open,
  onOpenChange,
  title = "Continúa con Google",
  description = "Inicia sesión para usar las funciones Pro de ExcelFlow.",
}: AuthModalProps) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = getSupabasePublicEnv().isConfigured;

  async function signInWithGoogle() {
    setError(null);
    setPending(true);

    try {
      if (!configured) {
        throw new Error(
          "Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY, y habilita Google en Supabase Auth.",
        );
      }

      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={signInWithGoogle}
            disabled={pending}
          >
            {pending ? t.auth.pending : t.auth.google}
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="mt-0.5 size-3.5 shrink-0" />
              {t.auth.hint}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

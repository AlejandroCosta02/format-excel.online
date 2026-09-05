"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function PaymentSuccessClient() {
  const { user, ready, isPro, openAuth } = useAuth();
  const [activated, setActivated] = useState(isPro);

  useEffect(() => {
    if (isPro) setActivated(true);
  }, [isPro]);

  useEffect(() => {
    if (!user || !getSupabasePublicEnv().isConfigured) return;

    const userId = user.id;
    const supabase = createClient();

    async function pull() {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .maybeSingle();
      if (data?.subscription_status === "pro") setActivated(true);
    }

    void pull();
    const interval = window.setInterval(() => void pull(), 3000);
    const channel = supabase
      .channel(`payment-success-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const status = (payload.new as { subscription_status?: string }).subscription_status;
          if (status === "pro") setActivated(true);
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-excel/10 text-excel">
          {activated ? (
            <CheckCircle className="size-10" />
          ) : (
            <CheckCircle className="size-10 text-primary" />
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {activated ? "¡Cuenta Pro Activada!" : "¡Pago Recibido con Éxito!"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {activated
            ? "Ya puedes guardar plantillas, hacer mail merge ilimitado y procesar archivos en lote."
            : "Tu cuenta Pro está siendo activada. Estamos validando la confirmación en la blockchain."}
        </p>

        {!ready ? (
          <p className="mt-6 text-sm text-muted-foreground">Cargando sesión…</p>
        ) : !user ? (
          <Button type="button" className="mt-6" onClick={() => openAuth()}>
            Inicia sesión para ver el estado Pro
          </Button>
        ) : activated ? (
          <Button asChild className="mt-6 bg-excel text-excel-foreground hover:bg-excel-hover">
            <Link href="/">Ir a mis Herramientas Pro</Link>
          </Button>
        ) : (
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Esperando confirmación de NOWPayments…
          </p>
        )}
      </motion.div>
    </main>
  );
}

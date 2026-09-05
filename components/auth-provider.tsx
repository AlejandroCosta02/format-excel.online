"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { AuthModal } from "@/components/auth-modal";
import { UpgradeProModal } from "@/components/upgrade-pro-modal";
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { ensureProfile } from "@/lib/templates/store";
import type { SubscriptionStatus } from "@/lib/billing/constants";

export type AuthPrompt = {
  title: string;
  description: string;
};

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  isPro: boolean;
  subscriptionStatus: SubscriptionStatus;
  requireAuth: (prompt?: AuthPrompt) => boolean;
  requirePro: (prompt?: AuthPrompt) => boolean;
  signOut: () => Promise<void>;
  openAuth: (prompt?: AuthPrompt) => void;
  openUpgrade: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_PROMPT: AuthPrompt = {
  title: "Continúa con Google",
  description: "Crea una cuenta gratis. El plan Pro se activa solo después del pago.",
};

const DEFAULT_PRO_PROMPT: AuthPrompt = {
  title: "Esta función es Pro",
  description: "Inicia sesión y suscríbete para guardar plantillas, lotes y envíos ilimitados.",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("free");
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [prompt, setPrompt] = useState<AuthPrompt>(DEFAULT_PROMPT);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser || !getSupabasePublicEnv().isConfigured) {
      setSubscriptionStatus("free");
      return;
    }
    try {
      await ensureProfile(nextUser);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", nextUser.id)
        .maybeSingle();
      const status = data?.subscription_status === "pro" ? "pro" : "free";
      setSubscriptionStatus(status);
    } catch {
      setSubscriptionStatus("free");
    }
  }, []);

  useEffect(() => {
    if (!getSupabasePublicEnv().isConfigured) {
      setReady(true);
      return;
    }

    const supabase = createClient();

    void supabase.auth.getSession().then(({ data }) => {
      const next = data.session?.user ?? null;
      setUser(next);
      void loadProfile(next).finally(() => setReady(true));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      void loadProfile(next);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    if (!user || !getSupabasePublicEnv().isConfigured) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const status = (payload.new as { subscription_status?: string }).subscription_status;
          setSubscriptionStatus(status === "pro" ? "pro" : "free");
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => void loadProfile(user);
    if (new URLSearchParams(window.location.search).get("billing") === "success") {
      refresh();
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [loadProfile, user]);

  const openAuth = useCallback((next?: AuthPrompt) => {
    setPrompt(next ?? DEFAULT_PROMPT);
    setAuthOpen(true);
  }, []);

  const openUpgrade = useCallback(() => {
    setUpgradeOpen(true);
  }, []);

  const requireAuth = useCallback(
    (next?: AuthPrompt) => {
      if (user) return true;
      openAuth(next);
      return false;
    },
    [openAuth, user],
  );

  const requirePro = useCallback(
    (next?: AuthPrompt) => {
      if (!user) {
        openAuth(next ?? DEFAULT_PRO_PROMPT);
        return false;
      }
      if (subscriptionStatus !== "pro") {
        openUpgrade();
        return false;
      }
      return true;
    },
    [openAuth, openUpgrade, subscriptionStatus, user],
  );

  const signOut = useCallback(async () => {
    setSubscriptionStatus("free");
    if (!getSupabasePublicEnv().isConfigured) {
      setUser(null);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const isPro = subscriptionStatus === "pro";

  const value = useMemo(
    () => ({
      user,
      ready,
      isPro,
      subscriptionStatus,
      requireAuth,
      requirePro,
      signOut,
      openAuth,
      openUpgrade,
    }),
    [user, ready, isPro, subscriptionStatus, requireAuth, requirePro, signOut, openAuth, openUpgrade],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        title={prompt.title}
        description={prompt.description}
      />
      <UpgradeProModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        user={user}
        onLogin={() => {
          setUpgradeOpen(false);
          openAuth(DEFAULT_PRO_PROMPT);
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

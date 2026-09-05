"use client";

import { AuthProvider } from "@/components/auth-provider";

export function PaymentAuthShell({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

"use client";

import { SupabaseAuthProvider } from "./components/SupabaseAuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

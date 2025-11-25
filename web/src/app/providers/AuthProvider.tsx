"use client";

import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithPassword: (params: { email: string; password: string }) => Promise<{
    data: Session | null;
    error: string | null;
  }>;
  signOut: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (sessionError) {
        setError(sessionError.message);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setError(null);
      }
      setLoading(false);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setError(null);
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      return { data: null, error: signInError.message };
    }
    setSession(data.session);
    setUser(data.session?.user ?? null);
    return { data: data.session, error: null };
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    const isInvalidToken =
      typeof signOutError?.message === "string" &&
      signOutError.message.toLowerCase().includes("invalid");
    if (signOutError && !isInvalidToken) {
      setError(signOutError.message);
      return { error: signOutError.message };
    }
    setSession(null);
    setUser(null);
    setError(null);
    return { error: null };
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signInWithPassword,
      signOut,
    }),
    [user, session, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

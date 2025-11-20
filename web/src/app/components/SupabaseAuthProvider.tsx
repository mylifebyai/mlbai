"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  is_admin: boolean | null;
  is_patron: boolean | null;
  patreon_status?: string | null;
  patreon_full_name?: string | null;
  patreon_tier_id?: string | null;
  patreon_last_sync?: string | null;
};

type AuthContextValue = {
  client: SupabaseClient;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(
    async (userId: string) => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, is_admin, is_patron, patreon_status, patreon_full_name, patreon_tier_id, patreon_last_sync"
        )
        .eq("id", userId)
        .single();
      if (error) {
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
      setProfileLoading(false);
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const currentSession = data.session ?? null;
      setSession(currentSession);
      setSessionLoading(false);
      if (currentSession?.user) {
        loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLoading(false);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const isLoading = sessionLoading || profileLoading;

  const value = useMemo<AuthContextValue>(
    () => ({
      client: supabase,
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      refreshProfile: () => {
        if (session?.user) {
          loadProfile(session.user.id);
        }
      },
    }),
    [session, profile, isLoading, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within SupabaseAuthProvider");
  }
  return ctx;
}

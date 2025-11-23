"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Role = "admin" | "tester" | "regular";

export function useProfileRole(userId: string | undefined) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async () => {
      if (!userId) {
        if (!isMounted) return;
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!isMounted) return;
      if (fetchError) {
        setError(fetchError.message);
        setRole(null);
      } else {
        const r = (data?.role as Role | null) ?? null;
        setRole(r);
        setError(null);
      }
      setLoading(false);
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { role, loading, error };
}

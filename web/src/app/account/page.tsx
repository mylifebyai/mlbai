"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

type AccountProfile = {
  id: string;
  email: string | null;
  role: string | null;
  patreon_user_id: string | null;
  patreon_tier_id: string | null;
  patreon_status: string | null;
  patreon_last_sync_at: string | null;
};

function AccountContent() {
  const { user, session, loading: authLoading, signInWithPassword, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patreonMessage, setPatreonMessage] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const patreonNotice = searchParams.get("patreon");
  const patreonReason = searchParams.get("reason");
  const patreonRole = searchParams.get("role");
  const redirectPath = useMemo(() => sanitizeRedirect(searchParams.get("redirect")), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (patreonNotice === "linked") {
      setPatreonMessage(
        patreonRole
          ? `Patreon linked. Updated role: ${patreonRole}.`
          : "Patreon linked successfully.",
      );
    } else if (patreonNotice === "error") {
      setError(patreonReason ?? "Patreon link failed. Try again.");
    }
  }, [patreonNotice, patreonReason, patreonRole]);

  const fetchProfile = async () => {
    if (!session?.access_token) return;
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to load profile");
      }
      const data = await res.json();
      setProfile(data.profile as AccountProfile);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!session?.access_token) return;
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const handlePatreonLink = async () => {
    if (!session?.access_token) {
      setError("You need to sign in before linking Patreon.");
      return;
    }
    setLinking(true);
    setError(null);
    setPatreonMessage(null);
    try {
      const res = await fetch("/api/patreon/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ redirectTo: "/account" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unable to start Patreon flow.");
      }
      const data = await res.json();
      if (!data?.url) {
        throw new Error("Patreon redirect missing. Try again.");
      }
      window.location.href = data.url as string;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to start Patreon link.");
      setLinking(false);
    }
  };


  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const patreonStatusLabel = useMemo(() => {
    if (!profile?.patreon_status || profile.patreon_status === "no_membership") {
      return "Not linked yet";
    }
    if (profile.patreon_status === "revoked") return "Link revoked";
    return profile.patreon_status;
  }, [profile?.patreon_status]);

  const patreonTierLabel = profile?.patreon_tier_id ?? null;
  const lastSyncLabel = profile?.patreon_last_sync_at
    ? new Date(profile.patreon_last_sync_at).toLocaleString()
    : null;
  const isPatreonLinked = !!profile?.patreon_status && profile.patreon_status !== "no_membership";
  const patreonButtonLabel = linking
    ? "Opening Patreon…"
    : isPatreonLinked
      ? "Refresh Patreon"
      : "Link Patreon";

  const ensureProfile = async (accessToken: string | null) => {
    if (!accessToken) return;
    try {
      await fetch("/api/account/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
    } catch (err) {
      console.error("Profile ensure failed", err);
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || redirecting || authLoading) return;
    setFormError(null);
    setStatusMessage(null);
    setSubmitting(true);

    if (user) {
      await signOut();
      setSubmitting(false);
      router.replace("/account");
      return;
    }

    const signInResult = await signInWithPassword({ email, password });
    if (!signInResult.error) {
      await ensureProfile(signInResult.data?.access_token ?? null);
      setRedirecting(true);
      router.replace(redirectPath);
      return;
    }

    // If sign-in failed, attempt to create the account automatically.
    const confirmRedirect =
      typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: confirmRedirect ? { emailRedirectTo: confirmRedirect } : undefined,
    });

    if (signUpError) {
      setFormError(signUpError.message);
      setSubmitting(false);
      return;
    }

    const newUserId = data.user?.id ?? data.session?.user?.id;
    const accessToken = data.session?.access_token ?? null;
    if (newUserId && accessToken) {
      const profileRes = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: newUserId, email, role: "regular" }),
      });
      if (!profileRes.ok) {
        setFormError("Account created, but failed to finish setup. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    if (data.session) {
      await ensureProfile(accessToken);
      setRedirecting(true);
      router.replace(redirectPath);
      return;
    }

    setStatusMessage("Account created. Check your email to confirm, then sign in.");
    setSubmitting(false);
  };

  const handlePatreonUnlink = async () => {
    if (!session?.access_token) {
      setError("You need to sign in before unlinking Patreon.");
      return;
    }
    setUnlinking(true);
    setPatreonMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/patreon/unlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unable to disconnect Patreon.");
      }
      await fetchProfile();
      setPatreonMessage("Patreon disconnected.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to disconnect Patreon.");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <main className="analytics-page">
      <section className="wrapper app-shell analytics-shell">
        <div className="analytics-back">
          <Link className="analytics-back-link" href="/" aria-label="Back to home">
            ← Back to My Life, By AI
          </Link>
        </div>
        <header className="analytics-header">
          <span className="hero-eyebrow">Account</span>
          <h1>Access & Patreon link</h1>
          <p>
            One place to sign in, see your role, and link Patreon for tester access. If you&apos;re
            new, create an account below.
          </p>
        </header>

        {error ? (
          <div className="analytics-error">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span>{error}</span>
              {error.toLowerCase().includes("patreon") ? (
                <a
                  className="btn-secondary"
                  href="https://www.patreon.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{ alignSelf: "flex-start" }}
                >
                  Open Patreon
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
        {patreonMessage ? <div className="form-success">{patreonMessage}</div> : null}

        {!user ? (
          <div className="analytics-grid" style={{ marginBottom: "1.25rem", gap: "1.2rem" }}>
            <article className="analytics-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p className="analytics-card-label">Sign in or create</p>
              <h2 style={{ margin: 0 }}>Access your account</h2>
              <p className="analytics-card-sub">
                Use email and password to sign in. If we don&apos;t find your account, we&apos;ll
                create one instantly with the same form.
              </p>
              {redirecting && <p className="analytics-footnote">Redirecting…</p>}
              <form className="auth-form" onSubmit={handleAuthSubmit} style={{ gap: "0.75rem" }}>
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting || redirecting || authLoading}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting || redirecting || authLoading}
                    placeholder="••••••••"
                  />
                </div>
                {formError ? <p className="form-error">{formError}</p> : null}
                {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || redirecting || authLoading}
                >
                  {submitting
                    ? "Working…"
                    : redirecting
                      ? "Redirecting…"
                      : "Continue"}
                </button>
                <p className="auth-hint">
                  Need access or a reset? Reach out to the admin to confirm your account.
                </p>
              </form>
            </article>
          </div>
        ) : null}

        {user ? (
          <>
            <div className="analytics-grid" style={{ marginBottom: "1.25rem", gap: "1.2rem" }}>
              <article className="analytics-card" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <p className="analytics-card-label">Signed in as</p>
                <p className="analytics-card-value" style={{ fontSize: "1.25rem", color: "var(--text)" }}>
                  {profile?.email ?? user?.email ?? "Loading…"}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" className="btn-secondary" onClick={handleSignOut}>
                    Sign out
                  </button>
                  <Link href="/account/delete" className="btn-ghost" style={{ textDecoration: "none" }}>
                    Delete account
                  </Link>
                </div>
              </article>

              <article className="analytics-card" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <p className="analytics-card-label">Patreon</p>
                <p className="analytics-footnote" style={{ margin: 0 }}>
                  Ensure you&apos;re signed into your Patreon account before linking.
                </p>
                <div style={{ display: "flex", flexDirection: "row", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                    <p className="analytics-card-value" style={{ margin: 0, fontSize: "1.25rem", color: "var(--text)" }}>
                      {loadingProfile
                        ? "Checking…"
                        : patreonStatusLabel
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </p>
                    <span className="analytics-footnote">Tier: {patreonTierLabel ? "Grade 2+" : "—"}</span>
                  </div>
                  {lastSyncLabel ? (
                    <p className="analytics-footnote" style={{ margin: 0 }}>
                      Last synced: {lastSyncLabel}
                    </p>
                  ) : (
                    <p className="analytics-footnote" style={{ margin: 0 }}>Not synced yet</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.15rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePatreonLink}
                    disabled={linking || authLoading}
                  >
                    {patreonButtonLabel}
                  </button>
                  {isPatreonLinked ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handlePatreonUnlink}
                      disabled={unlinking || authLoading}
                    >
                      {unlinking ? "Disconnecting…" : "Disconnect Patreon"}
                    </button>
                  ) : null}
                </div>
              </article>
            </div>

            <div className="analytics-table-card">
              <div className="analytics-table-header">
                <h2>What to know</h2>
              </div>
              <p className="analytics-footnote" style={{ margin: 0 }}>
                Linking maps Grade 2+ Patreon members to tester. Admins stay admin; daily sync keeps roles current.
              </p>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

function sanitizeRedirect(raw: string | null): string {
  if (!raw) return "/account";
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/account";
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="analytics-page">
          <section className="wrapper app-shell analytics-shell">Loading…</section>
        </main>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "../providers/AuthProvider";

function sanitizeRedirect(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}

export default function LoginPage() {
  const { user, loading, signInWithPassword, signOut } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectPath = useMemo(
    () => sanitizeRedirect(searchParams.get("redirect")),
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || redirecting || loading) return;
    setFormError(null);
    setStatusMessage(null);
    setSubmitting(true);

    const signInResult = await signInWithPassword({ email, password });
    if (!signInResult.error) {
      setRedirecting(true);
      router.replace(redirectPath);
      return;
    }

    // If sign-in failed, attempt to create the account automatically.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setFormError(signUpError.message);
      setSubmitting(false);
      return;
    }

    const newUserId = data.user?.id ?? data.session?.user?.id;
    if (newUserId) {
      const profileRes = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId, email, role: "regular" }),
      });
      if (!profileRes.ok) {
        setFormError("Account created, but failed to finish setup. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    if (data.session) {
      setRedirecting(true);
      router.replace(redirectPath);
      return;
    }

    setStatusMessage("Account created. Check your email to confirm, then sign in.");
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    setFormError(null);
    setStatusMessage(null);
    await signOut();
    setSubmitting(false);
    setRedirecting(false);
  };

  return (
    <main className="auth-page">
      <section className="wrapper app-shell auth-shell">
        <div className="auth-back">
          <Link href="/" className="auth-back-link" aria-label="Back to home">
            ← Back to My Life, By AI
          </Link>
        </div>

        <div className="auth-grid">
          <div className="auth-hero">
            <p className="hero-eyebrow">Sign in or create</p>
            <h1>Access your account</h1>
            <p className="auth-lead">
              Use your email and password to sign in. If we don&apos;t find your account, you can
              create one instantly with the same form.
            </p>
            {redirecting && <p className="auth-redirecting">Redirecting…</p>}
            {user ? (
              <div className="auth-status-card">
                <div>
                  <p className="auth-status-label">Signed in as</p>
                  <p className="auth-status-email">{user.email}</p>
                </div>
                <div className="auth-status-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => router.replace(redirectPath)}
                  >
                    Continue
                  </button>
                  <button type="button" className="btn-ghost" onClick={handleSignOut}>
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="auth-card">
            <form className="auth-form" onSubmit={handleSubmit}>
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
                  disabled={submitting || redirecting || loading}
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
                  disabled={submitting || redirecting || loading}
                  placeholder="••••••••"
                />
              </div>
              {formError ? <p className="form-error">{formError}</p> : null}
              {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || redirecting || loading}
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
          </div>
        </div>
      </section>
    </main>
  );
}

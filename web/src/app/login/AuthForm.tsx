"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/app/components/SupabaseAuthProvider";

type AuthMode = "signin" | "signup";

type AuthFormProps = {
  redirectTo?: string;
};

export function AuthForm({ redirectTo }: AuthFormProps = {}) {
  const { client, user, isLoading, profile } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const destination = useMemo(() => redirectTo || "/promptly", [redirectTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setFormError("Email and password are both required.");
      return;
    }
    setFormError(null);
    setMessage(null);
    setSubmitting(true);

    const authPromise =
      mode === "signup"
        ? client.auth.signUp({ email, password })
        : client.auth.signInWithPassword({ email, password });

    const { error } = await authPromise;
    if (error) {
      setFormError(error.message);
    } else if (mode === "signup") {
      setMessage(
        "Account created. Check your inbox for the verification email before signing in."
      );
    } else {
      setMessage("Signed in successfully.");
      window.location.href = destination;
    }
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    setFormError(null);
    setMessage(null);
    setSubmitting(true);
    const { error } = await client.auth.signOut();
    if (error) {
      setFormError(error.message);
    } else {
      setMessage("Signed out.");
    }
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="auth-card__status" aria-live="polite">
        Checking your session…
      </div>
    );
  }

  if (user) {
    const isPatron = Boolean(profile?.is_patron);
    return (
      <div className="auth-card__status" aria-live="polite">
        <p>You are signed in as</p>
        <strong>{user.email}</strong>
        <p className="auth-status-detail">
          Patreon status:{" "}
          {isPatron ? "Linked (active supporter)" : "Not linked yet"}
        </p>
        <div className="auth-card__status-actions">
          {!isPatron && (
            <a
              className="auth-button"
              href={`/api/patreon/link?redirect=${encodeURIComponent(destination)}`}
            >
              Link Patreon
            </a>
          )}
          <Link className="auth-button" href={destination}>
            Continue
          </Link>
          <button
            className="auth-button auth-button--ghost"
            onClick={handleSignOut}
            disabled={submitting}
          >
            {submitting ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <div className="auth-tabs" role="tablist" aria-label="Choose auth mode">
        <button
          type="button"
          className={mode === "signin" ? "active" : ""}
          onClick={() => setMode("signin")}
          role="tab"
          aria-selected={mode === "signin"}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
          role="tab"
          aria-selected={mode === "signup"}
        >
          Create account
        </button>
      </div>
      <form className="auth-form__fields" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your secure password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={6}
            required
          />
        </label>
        {formError && (
          <p className="auth-alert error" role="alert">
            {formError}
          </p>
        )}
        {message && !formError && (
          <p className="auth-alert success" aria-live="polite">
            {message}
          </p>
        )}
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}

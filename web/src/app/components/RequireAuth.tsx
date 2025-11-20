"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useAuth } from "./SupabaseAuthProvider";

type RequireAuthProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  redirectTo?: string;
  requireAdmin?: boolean;
  adminMessage?: string;
  requirePatron?: boolean;
  patronMessage?: string;
};

export function RequireAuth({
  children,
  title = "Log in to keep going",
  description = "Members-only experiments live here. Sign in with the same email you share with MLBAI.",
  redirectTo,
  requireAdmin = false,
  adminMessage = "This section is for admins only.",
  requirePatron = false,
  patronMessage = "Link your Patreon membership to unlock this tool.",
}: RequireAuthProps) {
  const { user, isLoading, profile } = useAuth();
  const loginHref = useMemo(() => {
    if (redirectTo) {
      const encoded = encodeURIComponent(redirectTo);
      return `/login?redirect=${encoded}`;
    }
    return "/login";
  }, [redirectTo]);

  const patreonLink = useMemo(() => {
    const target = redirectTo || "/promptly";
    return `/api/patreon/link?redirect=${encodeURIComponent(target)}`;
  }, [redirectTo]);

  const missingAdmin = requireAdmin && (!profile || !profile.is_admin);
  const missingPatron = requirePatron && (!profile || !profile.is_patron);

  if (isLoading) {
    return (
      <section className="auth-gate">
        <div className="auth-gate-card">
          <p className="auth-eyebrow">Members access</p>
          <h1>Checking your session…</h1>
          <p className="auth-lede">One moment while we verify your login.</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="auth-gate">
        <div className="auth-gate-card">
          <p className="auth-eyebrow">Members access</p>
          <h1>{title}</h1>
          <p className="auth-lede">{description}</p>
          <Link className="auth-button" href={loginHref}>
            Go to login
          </Link>
          <p className="auth-footnote">
            Need an invite? Email{" "}
            <a href="mailto:mylife.byai@gmail.com">mylife.byai@gmail.com</a>.
          </p>
        </div>
      </section>
    );
  }

  if (missingAdmin) {
    return (
      <section className="auth-gate">
        <div className="auth-gate-card">
          <p className="auth-eyebrow">Admin access</p>
          <h1>Admins only</h1>
          <p className="auth-lede">{adminMessage}</p>
        </div>
      </section>
    );
  }

  if (missingPatron) {
    return (
      <section className="auth-gate">
        <div className="auth-gate-card">
          <p className="auth-eyebrow">Members access</p>
          <h1>Patreon membership required</h1>
          <p className="auth-lede">{patronMessage}</p>
          <a className="auth-button" href={patreonLink}>
            Link Patreon
          </a>
          <p className="auth-footnote">
            Need help? Email <a href="mailto:mylife.byai@gmail.com">mylife.byai@gmail.com</a>.
          </p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

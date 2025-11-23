"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { useProfileRole } from "../../hooks/useProfileRole";

export default function DeleteAccountPage() {
  const { user, session, signOut } = useAuth();
  const { role } = useProfileRole(user?.id);
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !user || !session?.access_token || confirmText !== "DELETE";

  const handleDelete = async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Unable to delete account.");
      }
      await signOut();
      router.replace("/login");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to delete account.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="analytics-page">
        <section className="wrapper app-shell analytics-shell">
          <div className="analytics-back">
            <Link className="analytics-back-link" href="/" aria-label="Back to home">
              ← Back to My Life, By AI
            </Link>
          </div>
          <p>You need to be signed in to manage your account.</p>
          <Link href="/login?redirect=/account/delete" className="btn-primary">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

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
          <h1>Delete account</h1>
          <p>
            This will permanently remove your account and profile. If you change your mind later,
            you will need to create a new account.
          </p>
          {role === "admin" && (
            <p className="analytics-error">
              Admin accounts cannot be deleted here. Contact support to make changes.
            </p>
          )}
        </header>
        <div className="analytics-table-card">
          <p>
            Type <strong>DELETE</strong> to confirm, then click Delete. This action cannot be
            undone.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              font: "inherit",
              marginTop: "0.75rem",
            }}
            disabled={loading}
          />
          {error ? <p className="form-error">{error}</p> : null}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", alignItems: "center" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDelete}
              disabled={disabled || loading || role === "admin"}
            >
              {loading ? "Deleting…" : "Delete account"}
            </button>
            <Link href="/" className="btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

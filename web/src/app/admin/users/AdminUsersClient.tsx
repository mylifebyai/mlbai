"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { useProfileRole } from "../../hooks/useProfileRole";
import { PRIMARY_ADMIN_EMAIL } from "@/lib/constants";

type UserRow = {
  id: string;
  email: string | null;
  role: string | null;
  patreon_status: string | null;
  patreon_tier_id: string | null;
  patreon_last_sync_at: string | null;
  patreon_user_id: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

const ALLOWED_ROLES = ["admin", "tester", "regular"];
export default function AdminUsersClient() {
  const { user, session } = useAuth();
  const { role, loading: roleLoading } = useProfileRole(user?.id);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => (a.email || "").localeCompare(b.email || "", "en")),
    [users],
  );

  useEffect(() => {
    if (!user || !session?.access_token) return;
    if (roleLoading || role !== "admin") return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          let msg = "Failed to load users";
          try {
            const errJson = await res.json();
            if (errJson?.error) msg = errJson.error;
          } catch {
            // ignore
          }
          throw new Error(`${msg} (status ${res.status})`);
        }
        const data = await res.json();
        setUsers(data.users ?? []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load users. Check admin access or try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, session?.access_token, role, roleLoading]);

  const handleRoleChange = async (id: string, email: string | null, nextRole: string) => {
    if (!session?.access_token) return;
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: id, role: nextRole, email }),
      });
      if (!res.ok) {
        throw new Error("Failed to update role");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u)),
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to update role. Try again.");
    } finally {
      setUpdatingId(null);
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
          <p>You need to sign in to view admin users.</p>
          <Link href="/login?redirect=/admin/users" className="btn-primary">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  if (roleLoading) {
    return (
      <main className="analytics-page">
        <section className="wrapper app-shell analytics-shell">
          <p>Checking admin access…</p>
        </section>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="analytics-page">
        <section className="wrapper app-shell analytics-shell">
          <div className="analytics-back">
            <Link className="analytics-back-link" href="/" aria-label="Back to home">
              ← Back to My Life, By AI
            </Link>
          </div>
          <p>You need admin access to view this page.</p>
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
          <span className="hero-eyebrow">Admin</span>
          <h1>Users & roles</h1>
          <p>View all users and update their roles. Changes take effect immediately.</p>
        </header>

        {error ? <div className="analytics-error">{error}</div> : null}

        {loading ? (
          <p>Loading users…</p>
        ) : (
          <div className="analytics-table-card">
            <div className="analytics-table-header">
              <h2>Users</h2>
              <p className="analytics-footnote">
                Roles: admin / tester / regular. Patreon status and tier are shown for linked
                accounts; admins remain admin even if Patreon lapses.
              </p>
            </div>
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Patreon</th>
                    <th>Last sign in</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="analytics-empty">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>
                          {u.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                fontWeight: 600,
                              }}
                            >
                              admin <span aria-hidden="true">🔒</span>
                            </span>
                          ) : (
                            <select
                              value={u.role ?? "regular"}
                              onChange={(e) =>
                                handleRoleChange(u.id, u.email ?? null, e.target.value)
                              }
                              disabled={updatingId === u.id}
                            >
                              {ALLOWED_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            <span style={{ fontWeight: 600 }}>
                              {u.patreon_status ?? "—"} {u.patreon_tier_id ? `· ${u.patreon_tier_id}` : ""}
                            </span>
                            <span className="analytics-footnote">
                              {u.patreon_last_sync_at
                                ? `Synced ${new Date(u.patreon_last_sync_at).toLocaleString()}`
                                : "Not synced"}
                            </span>
                          </div>
                        </td>
                        <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}</td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

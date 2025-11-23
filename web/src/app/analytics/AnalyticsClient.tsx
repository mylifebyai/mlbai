"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useProfileRole } from "../hooks/useProfileRole";

const RECENT_WINDOW_DAYS = 30;
const RECENT_LIMIT = 500;
const DAILY_WINDOW = 7;

type SiteEvent = {
  id: string;
  created_at: string;
  event_type: string;
  path: string | null;
  referrer: string | null;
  ip_hash: string | null;
  metadata: Record<string, unknown> | null;
};

type TopItem = { label: string; count: number };
type DailyView = { isoDate: string; label: string; count: number };
type AvgTimeItem = { path: string; averageSeconds: number; samples: number };

type AnalyticsSnapshot = {
  ready: boolean;
  error?: string;
  totalEvents: number;
  recentEvents: SiteEvent[];
  uniqueVisitors: number;
  topPaths: TopItem[];
  topReferrers: TopItem[];
  dailyViews: DailyView[];
  avgTimeByPath: AvgTimeItem[];
  windowLabel: string;
  limitReached: boolean;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export default function AnalyticsClient() {
  const { user, session } = useAuth();
  const { role, loading: roleLoading } = useProfileRole(user?.id);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const windowLabel = useMemo(
    () => snapshot?.windowLabel ?? "",
    [snapshot?.windowLabel],
  );

  useEffect(() => {
    if (!user || !session?.access_token) return;
    if (roleLoading || role !== "admin") return;

    const fetchSnapshot = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics-snapshot", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) {
          let msg = "Unable to load analytics. Check admin access or API.";
          try {
            const errJson = await res.json();
            if (errJson?.error) msg = errJson.error;
          } catch {
            // ignore
          }
          throw new Error(`${msg} (status ${res.status})`);
        }
        const data: AnalyticsSnapshot = await res.json();
        setSnapshot(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Unknown error loading analytics.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [user, session?.access_token, role, roleLoading]);

  if (!user) {
    return (
      <main className="analytics-page">
        <section className="wrapper app-shell analytics-shell">
          <div className="analytics-back">
            <Link className="analytics-back-link" href="/" aria-label="Back to home">
              ← Back to My Life, By AI
            </Link>
          </div>
          <p>You need to sign in to view analytics.</p>
          <Link href="/login?redirect=/analytics" className="btn-primary">
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
          <p>Checking access…</p>
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
          <p>You need admin access to view analytics.</p>
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
          <span className="hero-eyebrow">Internal pulse check</span>
          <h1>Analytics dashboard</h1>
          <p>
            Quick snapshot of anonymous page views pulled straight from Supabase. Data below
            reflects events captured during the last {RECENT_WINDOW_DAYS} days
            {snapshot?.limitReached ? " (showing the newest 500 rows)." : "."}
          </p>
          {windowLabel && <p className="analytics-window-label">Window: {windowLabel}</p>}
        </header>

        {loading ? (
          <p>Loading analytics…</p>
        ) : error || !snapshot ? (
          <div className="analytics-error">
            <p>Unable to load analytics. {error}</p>
            <p>Double-check admin access and the /api/admin/analytics-snapshot API.</p>
          </div>
        ) : (
          <>
            <div className="analytics-grid">
              <article className="analytics-card">
                <p className="analytics-card-label">All-time page views</p>
                <p className="analytics-card-value">
                  {numberFormatter.format(snapshot.totalEvents)}
                </p>
                <p className="analytics-card-sub">Across every event stored</p>
              </article>
              <article className="analytics-card">
                <p className="analytics-card-label">Unique visitors</p>
                <p className="analytics-card-value">
                  {numberFormatter.format(snapshot.uniqueVisitors)}
                </p>
                <p className="analytics-card-sub">Distinct hashed IPs</p>
              </article>
            </div>

            <div className="analytics-panels">
              <div className="analytics-panel">
                <h2>Top paths</h2>
                <ul className="analytics-list">
                  {snapshot.topPaths.length === 0 ? (
                    <li>No data</li>
                  ) : (
                    snapshot.topPaths.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <span>{item.count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="analytics-panel">
                <h2>Top referrers</h2>
                <ul className="analytics-list">
                  {snapshot.topReferrers.length === 0 ? (
                    <li>No data</li>
                  ) : (
                    snapshot.topReferrers.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <span>{item.count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="analytics-panel">
                <h2>Daily views (last {DAILY_WINDOW} days)</h2>
                <ul className="analytics-list analytics-daily-list">
                  {snapshot.dailyViews.length === 0 ? (
                    <li>No data</li>
                  ) : (
                    snapshot.dailyViews.map((day) => (
                      <li key={day.isoDate}>
                        <span>{day.label}</span>
                        <span>{day.count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="analytics-panel">
              <h2>Avg time by path</h2>
              {snapshot.avgTimeByPath.length === 0 ? (
                <p className="analytics-empty">No duration data yet.</p>
              ) : (
                <ul className="analytics-list">
                  {snapshot.avgTimeByPath.map((item) => (
                    <li key={item.path}>
                      <span>{item.path}</span>
                      <span>
                        {item.averageSeconds.toFixed(1)}s{" "}
                        <span className="analytics-list-hint">
                          ({item.samples} samples)
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="analytics-table-card">
              <div className="analytics-table-header">
                <h2>Recent events (latest {RECENT_LIMIT})</h2>
                <p className="analytics-footnote">
                  Showing event type, path, referrer, and timestamp.
                </p>
              </div>
              <div className="analytics-table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Path</th>
                      <th>Referrer</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.recentEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="analytics-empty">
                          No events captured yet.
                        </td>
                      </tr>
                    ) : (
                      snapshot.recentEvents.map((event) => (
                        <tr key={event.id}>
                          <td>{event.event_type}</td>
                          <td>{event.path ?? "/"}</td>
                          <td>{event.referrer ?? "—"}</td>
                          <td>{new Date(event.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const metadata: Metadata = {
  title: "Analytics Snapshot – My Life, By AI",
  description:
    "Internal usage pulse pulled straight from Supabase so the team can monitor traffic at a glance.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABLE_NAME = "site_events";
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

async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [{ count: totalEvents, error: totalError }, recentResult] = await Promise.all([
      supabaseAdmin.from(TABLE_NAME).select("*", { head: true, count: "exact" }),
      supabaseAdmin
        .from(TABLE_NAME)
        .select("id, event_type, path, referrer, ip_hash, metadata, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
    ]);

    if (totalError) {
      throw totalError;
    }
    if (recentResult.error) {
      throw recentResult.error;
    }

    const recentEvents = recentResult.data ?? [];

    const topPaths = aggregateTopItems(recentEvents, (event) => event.path ?? "/");
    const topReferrers = aggregateTopItems(recentEvents, (event) => {
      if (!event.referrer) return "Direct / internal";
      try {
        const url = new URL(event.referrer);
        return url.hostname.replace(/^www\./, "");
      } catch {
        return event.referrer;
      }
    });

    const dailyViews = computeDailyViews(recentEvents);
    const avgTimeByPath = computeAvgTimeByPath(recentEvents);

    const uniqueVisitors = new Set(
      recentEvents.map((event) => event.ip_hash).filter(Boolean) as string[],
    ).size;

    return {
      ready: true,
      totalEvents: totalEvents ?? 0,
      recentEvents,
      uniqueVisitors,
      topPaths,
      topReferrers,
      dailyViews,
      avgTimeByPath,
      windowLabel: `${since.toLocaleDateString()} – ${new Date().toLocaleDateString()}`,
      limitReached: recentEvents.length === RECENT_LIMIT,
    };
  } catch (error) {
    console.error("Failed to load analytics snapshot", error);
    return {
      ready: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error. Check the Supabase connection.",
      totalEvents: 0,
      recentEvents: [],
      uniqueVisitors: 0,
      topPaths: [],
      topReferrers: [],
      dailyViews: [],
      avgTimeByPath: [],
      windowLabel: "",
      limitReached: false,
    };
  }
}

function aggregateTopItems(
  events: SiteEvent[],
  getKey: (event: SiteEvent) => string | null,
): TopItem[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = getKey(event);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
}

function computeDailyViews(events: SiteEvent[]): DailyView[] {
  const cutoff = new Date(Date.now() - DAILY_WINDOW * 24 * 60 * 60 * 1000);
  const map = new Map<string, number>();
  for (const event of events) {
    if (event.event_type !== "page_view") continue;
    const date = new Date(event.created_at);
    if (date < cutoff) continue;
    const key = date.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([iso, count]) => ({
      isoDate: iso,
      label: formatDailyLabel(iso),
      count,
    }))
    .slice(-DAILY_WINDOW);
}

function computeAvgTimeByPath(events: SiteEvent[]): AvgTimeItem[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const event of events) {
    if (event.event_type !== "page_duration") continue;
    const path = event.path ?? "/";
    const durationMs = Number(event.metadata?.durationMs);
    if (!Number.isFinite(durationMs) || durationMs <= 0) continue;
    const current = map.get(path) ?? { total: 0, count: 0 };
    current.total += durationMs;
    current.count += 1;
    map.set(path, current);
  }
  return Array.from(map.entries())
    .map(([path, { total, count }]) => ({
      path,
      averageSeconds: total / count / 1000,
      samples: count,
    }))
    .sort((a, b) => b.averageSeconds - a.averageSeconds)
    .slice(0, 5);
}

export default async function AnalyticsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?redirect=/analytics");
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return (
      <main className="auth-gate">
        <div className="auth-gate-card">
          <p className="auth-eyebrow">Admin access</p>
          <h1>Admins only</h1>
          <p className="auth-lede">
            This analytics view is limited to MLBAI admins. Log in with the owner account to continue.
          </p>
          <Link className="auth-button" href="/login?redirect=/analytics">
            Switch accounts
          </Link>
        </div>
      </main>
    );
  }

  const snapshot = await getAnalyticsSnapshot();

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
            {snapshot.limitReached ? " (showing the newest 500 rows)." : "."}
          </p>
          {snapshot.windowLabel && (
            <p className="analytics-window-label">Window: {snapshot.windowLabel}</p>
          )}
        </header>

        {!snapshot.ready ? (
          <div className="analytics-error">
            <p>Unable to load analytics. {snapshot.error}</p>
            <p>Double-check the Supabase environment variables and site_events table.</p>
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
                <p className="analytics-card-label">Recent events</p>
                <p className="analytics-card-value">
                  {numberFormatter.format(snapshot.recentEvents.length)}
                </p>
                <p className="analytics-card-sub">
                  Captured in the last {RECENT_WINDOW_DAYS} days
                </p>
              </article>
              <article className="analytics-card">
                <p className="analytics-card-label">Unique visitors*</p>
                <p className="analytics-card-value">
                  {numberFormatter.format(snapshot.uniqueVisitors)}
                </p>
                <p className="analytics-card-sub">
                  Based on salted IP hashes (approximate)
                </p>
              </article>
            </div>

            <div className="analytics-panels">
              <div className="analytics-panel">
                <h2>Top paths</h2>
                {snapshot.topPaths.length === 0 ? (
                  <p className="analytics-empty">No page views recorded yet.</p>
                ) : (
                  <ul className="analytics-list">
                    {snapshot.topPaths.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <strong>{numberFormatter.format(item.count)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="analytics-panel">
                <h2>Top referrers</h2>
                {snapshot.topReferrers.length === 0 ? (
                  <p className="analytics-empty">No referrer data yet.</p>
                ) : (
                  <ul className="analytics-list">
                    {snapshot.topReferrers.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <strong>{numberFormatter.format(item.count)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="analytics-panels">
              <div className="analytics-panel">
                <h2>Daily views (last {DAILY_WINDOW} days)</h2>
                {snapshot.dailyViews.length === 0 ? (
                  <p className="analytics-empty">No traffic recorded yet.</p>
                ) : (
                  <ul className="analytics-list analytics-daily-list">
                    {snapshot.dailyViews.map((day) => (
                      <li key={day.isoDate}>
                        <span>{day.label}</span>
                        <strong>{numberFormatter.format(day.count)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="analytics-panel">
                <h2>Avg time on page</h2>
                {snapshot.avgTimeByPath.length === 0 ? (
                  <p className="analytics-empty">
                    No duration data yet. Keep browsing to generate samples.
                  </p>
                ) : (
                  <ul className="analytics-list">
                    {snapshot.avgTimeByPath.map((item) => (
                      <li key={item.path}>
                        <span>{item.path}</span>
                        <strong>
                          {Math.round(item.averageSeconds)}s
                          <span className="analytics-list-hint">
                            ({item.samples} hits)
                          </span>
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="analytics-table-card">
              <div className="analytics-table-header">
                <h2>Latest events</h2>
                <p>Showing the 15 most recent page views.</p>
              </div>
              {snapshot.recentEvents.length === 0 ? (
                <p className="analytics-empty">Nothing logged yet.</p>
              ) : (
                <div className="analytics-table-wrapper">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Path</th>
                        <th>Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.recentEvents.slice(0, 15).map((event) => (
                        <tr key={event.id}>
                          <td>{formatDate(event.created_at)}</td>
                          <td>{event.path ?? "/"}</td>
                          <td>{event.referrer ? trimReferrer(event.referrer) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="analytics-footnote">
                *Unique visitors are approximated using the hashed IP value and reset outside the{" "}
                {RECENT_WINDOW_DAYS}-day window.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function trimReferrer(referrer: string) {
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
}

function formatDailyLabel(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

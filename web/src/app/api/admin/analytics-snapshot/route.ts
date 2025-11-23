import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

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
      label: new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", authUser.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const snapshot: AnalyticsSnapshot = {
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

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Analytics snapshot error", error);
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : "Unknown error. Check Supabase connection.",
        totalEvents: 0,
        recentEvents: [],
        uniqueVisitors: 0,
        topPaths: [],
        topReferrers: [],
        dailyViews: [],
        avgTimeByPath: [],
        windowLabel: "",
        limitReached: false,
      },
      { status: 500 },
    );
  }
}

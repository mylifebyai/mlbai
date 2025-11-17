"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function serializeSearchParams(searchParams: ReturnType<typeof useSearchParams>) {
  if (!searchParams) return "";
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

type AnalyticsPayload = {
  eventType: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export function AnalyticsReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visitRef = useRef<{ path: string; startedAt: number } | null>(null);

  const sendAnalytics = useCallback((payload: AnalyticsPayload) => {
    if (typeof navigator === "undefined" || typeof window === "undefined") {
      return;
    }
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Analytics should never block navigation
    });
  }, []);

  const flushDuration = useCallback(() => {
    if (!visitRef.current || typeof performance === "undefined") {
      return;
    }
    const durationMs = Math.round(performance.now() - visitRef.current.startedAt);
    if (durationMs < 500) {
      return;
    }
    sendAnalytics({
      eventType: "page_duration",
      path: visitRef.current.path,
      metadata: { durationMs },
    });
    visitRef.current.startedAt = performance.now();
  }, [sendAnalytics]);

  useEffect(() => {
    const search = serializeSearchParams(searchParams);
    const fullPath = `${pathname || "/"}${search}`;

    if (visitRef.current) {
      flushDuration();
    }

    const payload: AnalyticsPayload = {
      eventType: "page_view",
      path: fullPath,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      metadata: search ? { search } : undefined,
    };

    sendAnalytics(payload);

    visitRef.current = {
      path: fullPath,
      startedAt:
        typeof performance !== "undefined" ? performance.now() : Date.now(),
    };
  }, [pathname, searchParams, flushDuration, sendAnalytics]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDuration();
      }
    };
    const handlePageHide = () => {
      flushDuration();
    };
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushDuration();
    };
  }, [flushDuration]);

  return null;
}

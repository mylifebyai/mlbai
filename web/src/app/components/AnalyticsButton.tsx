"use client";

import Link from "next/link";
import { useAuth } from "./SupabaseAuthProvider";

export function AnalyticsButton() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading || !user || !profile?.is_admin) {
    return null;
  }

  return (
    <Link
      href="/analytics"
      className="analytics-fab"
      aria-label="Open internal analytics snapshot"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20h16" />
        <polyline points="5 14 9 10 13 14 19 7" />
        <circle cx="19" cy="7" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    </Link>
  );
}

import type { Metadata } from "next";
import AnalyticsClient from "./AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics Snapshot – My Life, By AI",
  description:
    "Internal usage pulse pulled straight from Supabase so the team can monitor traffic at a glance.",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}

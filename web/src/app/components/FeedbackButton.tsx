"use client";

import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";
import { useProfileRole } from "../hooks/useProfileRole";

export function FeedbackButton() {
  const { user } = useAuth();
  const { role } = useProfileRole(user?.id);

  if (role !== "admin" && role !== "tester") {
    return null;
  }

  return (
    <Link
      href="/feedback"
      className="feedback-fab"
      aria-label="Report an issue or leave testing feedback"
    >
      <span aria-hidden="true">🐞</span>
    </Link>
  );
}

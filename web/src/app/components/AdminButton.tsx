"use client";

import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";
import { useProfileRole } from "../hooks/useProfileRole";

export function AdminButton() {
  const { user } = useAuth();
  const { role } = useProfileRole(user?.id);

  if (role !== "admin") {
    return null;
  }

  return (
    <Link href="/admin/users" className="feedback-fab admin-fab" aria-label="Open admin users">
      <span aria-hidden="true">🛡️</span>
    </Link>
  );
}

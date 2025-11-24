"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

function sanitizeRedirect(raw: string | null): string {
  if (!raw) return "/account";
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/account";
}

function LoginInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectPath = sanitizeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    router.replace(redirectPath);
  }, [redirectPath, router]);

  return (
    <main className="auth-page">
      <section className="wrapper app-shell auth-shell">
        <p className="auth-hint">This page moved. Redirecting to your account…</p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <div className="wrapper app-shell auth-shell">Loading…</div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

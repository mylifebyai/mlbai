"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  const { status, error, description } = useMemo(() => {
    const statusParam = searchParams.get("status");
    const errorParam = searchParams.get("error") ?? searchParams.get("error_description");
    const descriptionParam = searchParams.get("error_description") ?? searchParams.get("message");
    return {
      status: statusParam,
      error: errorParam,
      description: descriptionParam,
    };
  }, [searchParams]);

  const isSuccess = !error && (status === "success" || !status);
  const headline = isSuccess ? "Email confirmed" : "Confirmation failed";
  const detail = isSuccess
    ? "You can continue to your account and link Patreon."
    : error ?? description ?? "We could not confirm your email. Please try signing in again.";

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      setRedirecting(true);
      router.replace("/account");
    }, 1800);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  return (
    <main className="auth-page">
      <section className="wrapper app-shell auth-shell">
        <p className="auth-hint" style={{ marginBottom: "0.5rem" }}>
          My Life, By AI
        </p>
        <h1 style={{ margin: "0 0 0.35rem" }}>{headline}</h1>
        <p className="auth-hint" style={{ margin: 0 }}>
          {detail}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <Link href="/account" className="btn-primary">
            {redirecting ? "Taking you to account…" : "Go to account"}
          </Link>
        </div>
        {!isSuccess ? (
          <p className="auth-hint" style={{ marginTop: "0.75rem" }}>
            If this keeps happening, try signing in again or requesting a new email.
          </p>
        ) : null}
      </section>
    </main>
  );
}

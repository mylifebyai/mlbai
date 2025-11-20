import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "./AuthForm";

export const metadata: Metadata = {
  title: "Sign in – My Life, By AI",
  description:
    "Create your account or sign in with email and password to access members-only experiments.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const redirectParam = searchParams?.redirect;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/")
      ? redirectParam
      : undefined;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Members access</p>
        <h1>Log into My Life, By AI</h1>
        <p className="auth-lede">
          Use the same email you shared with the team. We&apos;ll expand to
          Patreon OAuth later, but for now email + password keeps things simple
          and secure.
        </p>
        <AuthForm redirectTo={redirectTo} />
        <p className="auth-footnote">
          Lost access? Email{" "}
          <a href="mailto:mylife.byai@gmail.com">mylife.byai@gmail.com</a> with
          the address tied to your Patreon pledge.
        </p>
      </div>
      <Link className="auth-back-link" href="/">
        ← Back to the public site
      </Link>
    </main>
  );
}

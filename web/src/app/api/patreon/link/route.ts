import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const PATREON_AUTH_URL = "https://www.patreon.com/oauth2/authorize";
const DEFAULT_SCOPE = "identity identity[email] identity.memberships";
const STATE_COOKIE = "mlbai_patreon_state";
const REDIRECT_COOKIE = "mlbai_patreon_redirect";

export async function GET(req: NextRequest) {
  const cookiesPromise = cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookiesPromise,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const redirectParam = req.nextUrl.searchParams.get("redirect") || "/promptly";

  if (!session) {
    return NextResponse.redirect(
      `${new URL("/login", req.nextUrl.origin).toString()}?redirect=${encodeURIComponent(redirectParam)}`
    );
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const redirectUri = process.env.PATREON_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Patreon client configuration missing. Set PATREON_CLIENT_ID and PATREON_REDIRECT_URI." },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();

  const authUrl = new URL(PATREON_AUTH_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", DEFAULT_SCOPE);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  response.cookies.set(REDIRECT_COOKIE, redirectParam, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  return response;
}

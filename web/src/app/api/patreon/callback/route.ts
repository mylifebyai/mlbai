import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const TOKEN_URL = "https://www.patreon.com/api/oauth2/token";
const IDENTITY_URL =
  "https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields[user]=email,full_name&fields[member]=patron_status,currently_entitled_amount_cents,last_charge_date,last_charge_status";
const STATE_COOKIE = "mlbai_patreon_state";
const REDIRECT_COOKIE = "mlbai_patreon_redirect";

type PatreonIdentityResponse = {
  data: {
    id: string;
    attributes: {
      email: string | null;
      full_name: string | null;
    };
  };
  included?: Array<{
    type: string;
    id: string;
    attributes?: {
      patron_status?: string | null;
      currently_entitled_amount_cents?: number | null;
    };
    relationships?: {
      currently_entitled_tiers?: {
        data?: Array<{ id: string }>;
      };
    };
  }>;
};

function resolveRedirect(origin: string, path?: string | null) {
  try {
    const target = path && path.startsWith("/") ? path : "/promptly";
    return new URL(target, origin).toString();
  } catch {
    return origin;
  }
}

function buildRedirect(url: string, status: string) {
	const target = url.includes("?") ? `${url}&patreon=${status}` : `${url}?patreon=${status}`;
	const response = NextResponse.redirect(target);
	response.cookies.delete(STATE_COOKIE);
	response.cookies.delete(REDIRECT_COOKIE);
	return response;
}

function membershipFromIdentity(identity: PatreonIdentityResponse) {
  const membership = identity.included?.find((item) => item.type === "member");
  const patronStatus = membership?.attributes?.patron_status ?? null;
  const amountCents = membership?.attributes?.currently_entitled_amount_cents ?? 0;
  const tierId = membership?.relationships?.currently_entitled_tiers?.data?.[0]?.id ?? null;
  const isPatron = patronStatus === "active_patron" || (amountCents ?? 0) > 0;
  return { patronStatus, amountCents, tierId, isPatron };
}

export async function GET(req: NextRequest) {
  const cookiesPromise = cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookiesPromise,
  });
  const cookieStore = await cookiesPromise;
	const {
		data: { session },
	} = await supabase.auth.getSession();
	const origin = req.nextUrl.origin;
	const redirectCookie = cookieStore.get(REDIRECT_COOKIE);
  const redirectPath = redirectCookie?.value ?? "/promptly";
  const baseRedirect = resolveRedirect(origin, redirectPath);

  if (!session) {
    return NextResponse.redirect(
      `${new URL("/login", origin).toString()}?redirect=${encodeURIComponent(redirectPath)}`
    );
  }

  const state = req.nextUrl.searchParams.get("state");
	const storedState = cookieStore.get(STATE_COOKIE)?.value;
  if (!state || !storedState || state !== storedState) {
    return buildRedirect(baseRedirect, "state_mismatch");
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return buildRedirect(baseRedirect, "missing_code");
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  const redirectUri = process.env.PATREON_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return buildRedirect(baseRedirect, "missing_config");
  }

  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return buildRedirect(baseRedirect, "token_error");
    }

    const tokenJson = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
    };

    const identityResponse = await fetch(IDENTITY_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    if (!identityResponse.ok) {
      return buildRedirect(baseRedirect, "identity_error");
    }

    const identityJson = (await identityResponse.json()) as PatreonIdentityResponse;
    const { isPatron, patronStatus, tierId } = membershipFromIdentity(identityJson);

    const supabaseAdmin = createSupabaseAdmin();
    await supabaseAdmin.from("profiles").upsert({
      id: session.user.id,
      is_patron: isPatron,
      patreon_user_id: identityJson.data.id,
      patreon_email: identityJson.data.attributes.email,
      patreon_full_name: identityJson.data.attributes.full_name,
      patreon_status: patronStatus,
      patreon_tier_id: tierId,
      patreon_last_sync: new Date().toISOString(),
      patreon_refresh_token: tokenJson.refresh_token ?? null,
    });

    return buildRedirect(baseRedirect, isPatron ? "linked" : "inactive");
  } catch (error) {
    console.error("Patreon callback error", error);
    return buildRedirect(baseRedirect, "error");
  }
}

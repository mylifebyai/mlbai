import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const TOKEN_URL = "https://www.patreon.com/api/oauth2/token";
const IDENTITY_URL =
  "https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers&fields[user]=email,full_name&fields[member]=patron_status,currently_entitled_amount_cents,last_charge_date,last_charge_status";

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

function membershipFromIdentity(identity: PatreonIdentityResponse) {
  const membership = identity.included?.find((item) => item.type === "member");
  const patronStatus = membership?.attributes?.patron_status ?? null;
  const amountCents = membership?.attributes?.currently_entitled_amount_cents ?? 0;
  const tierId = membership?.relationships?.currently_entitled_tiers?.data?.[0]?.id ?? null;
  const isPatron = patronStatus === "active_patron" || (amountCents ?? 0) > 0;
  return { patronStatus, tierId, isPatron };
}

export async function POST(req: NextRequest) {
  const syncSecret = process.env.PATREON_SYNC_SECRET;
  if (!syncSecret) {
    return NextResponse.json(
      { error: "PATREON_SYNC_SECRET env var is not set." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.trim().toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : authHeader;
  const urlSecret = req.nextUrl.searchParams.get("secret");
  const providedSecret = bearer || urlSecret || "";
  if (providedSecret !== syncSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Patreon client configuration missing." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, patreon_refresh_token")
    .not("patreon_refresh_token", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const profile of profiles ?? []) {
    if (!profile.patreon_refresh_token) continue;
    try {
      const tokenResponse = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: profile.patreon_refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        results.push({ id: profile.id, status: "token_error" });
        continue;
      }

      const tokenJson = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token?: string;
      };

      const identityResponse = await fetch(IDENTITY_URL, {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });

      if (!identityResponse.ok) {
        results.push({ id: profile.id, status: "identity_error" });
        continue;
      }

      const identityJson = (await identityResponse.json()) as PatreonIdentityResponse;
      const { isPatron, patronStatus, tierId } = membershipFromIdentity(identityJson);

      await supabaseAdmin.from("profiles").upsert({
        id: profile.id,
        is_patron: isPatron,
        patreon_status: patronStatus,
        patreon_tier_id: tierId,
        patreon_last_sync: new Date().toISOString(),
        patreon_refresh_token: tokenJson.refresh_token ?? profile.patreon_refresh_token,
      });

      results.push({ id: profile.id, status: isPatron ? "active" : "inactive" });
    } catch (err) {
      console.error("Patreon refresh error", err);
      results.push({ id: profile.id, status: "error" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

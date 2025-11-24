import { createHmac, timingSafeEqual } from "crypto";
import { PRIMARY_ADMIN_EMAIL } from "./constants";

type PatreonConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  stateSecret: string;
  campaignId: string | null;
  testerTierIds: Set<string>;
};

export type PatreonTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
};

export type PatreonMembership = {
  patreonUserId: string | null;
  email: string | null;
  status: string | null;
  tierId: string | null;
  entitledCents: number | null;
  campaignId: string | null;
};

export type PatreonStatePayload = {
  userId: string;
  redirectTo: string;
};

function parseTesterTierIds(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set(ids);
}

export function getPatreonConfig(): PatreonConfig {
  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  const redirectUri = process.env.PATREON_REDIRECT_URI;
  const stateSecret = process.env.PATREON_STATE_SECRET;
  const campaignId = process.env.PATREON_CAMPAIGN_ID ?? null;
  const testerTierIds = parseTesterTierIds(process.env.PATREON_TESTER_TIER_IDS);

  if (!clientId || !clientSecret || !redirectUri || !stateSecret) {
    throw new Error(
      "Patreon configuration missing. Ensure PATREON_CLIENT_ID, PATREON_CLIENT_SECRET, PATREON_REDIRECT_URI, and PATREON_STATE_SECRET are set.",
    );
  }

  return { clientId, clientSecret, redirectUri, stateSecret, campaignId, testerTierIds };
}

function signStatePayload(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

function safeEquals(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function buildPatreonState(payload: PatreonStatePayload, secret?: string) {
  const config = getPatreonConfig();
  const effectiveSecret = secret ?? config.stateSecret;
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signStatePayload(encoded, effectiveSecret);
  return `${encoded}.${signature}`;
}

export function parsePatreonState(state: string | null, secret?: string): PatreonStatePayload | null {
  if (!state) return null;
  const config = getPatreonConfig();
  const effectiveSecret = secret ?? config.stateSecret;
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;

  const expected = signStatePayload(encoded, effectiveSecret);
  if (!safeEquals(expected, signature)) return null;

  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (typeof parsed?.userId === "string" && typeof parsed?.redirectTo === "string") {
      return parsed as PatreonStatePayload;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildPatreonAuthUrl(state: string, config = getPatreonConfig()) {
  const url = new URL("https://www.patreon.com/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", "identity identity.memberships");
  url.searchParams.set("state", state);
  return url.toString();
}

function computeExpiry(expiresInSeconds: unknown) {
  const seconds = Number(expiresInSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function requestPatreonToken(
  body: Record<string, string>,
  config = getPatreonConfig(),
): Promise<PatreonTokens> {
  const form = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    ...body,
  });

  const response = await fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.error_description === "string"
        ? data.error_description
        : `Patreon token request failed (${response.status})`;
    throw new Error(message);
  }

  const accessToken = typeof data?.access_token === "string" ? data.access_token : null;
  const refreshToken = typeof data?.refresh_token === "string" ? data.refresh_token : null;

  if (!accessToken || !refreshToken) {
    throw new Error("Patreon token response missing access or refresh token.");
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: computeExpiry(data?.expires_in),
  };
}

export async function exchangeCodeForToken(code: string, config = getPatreonConfig()) {
  return requestPatreonToken(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    },
    config,
  );
}

export async function refreshAccessToken(refreshToken: string, config = getPatreonConfig()) {
  return requestPatreonToken(
    {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    config,
  );
}

function pickMembership(included: unknown, campaignId: string | null) {
  if (!Array.isArray(included)) return null;
  const memberships = included.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      "type" in item &&
      (item as Record<string, unknown>).type === "member",
  ) as Array<Record<string, unknown>>;

  if (campaignId) {
    const targeted = memberships.find((member: any) => {
      const campaign = member.relationships?.campaign?.data?.id;
      return campaign && String(campaign) === campaignId;
    });
    if (targeted) return targeted;
  }

  return memberships[0] ?? null;
}

export async function fetchPatreonMembership(accessToken: string, campaignId: string | null) {
  const url = new URL("https://www.patreon.com/api/oauth2/v2/identity");
  url.searchParams.set(
    "include",
    "memberships,memberships.currently_entitled_tiers,memberships.campaign",
  );
  url.searchParams.set("fields[user]", "email,full_name");
  url.searchParams.set(
    "fields[member]",
    // Keep to fields allowed by the v2 API to avoid 400s.
    "patron_status,currently_entitled_amount_cents",
  );
  url.searchParams.set("fields[tier]", "title");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.detail === "string"
          ? json.detail
          : `Patreon membership fetch failed (${response.status})`;
    throw new Error(message);
  }

  const identity = json?.data;
  const membership = pickMembership(json?.included, campaignId);
  const membershipUserId =
    membership && typeof membership === "object"
      ? (membership as any)?.relationships?.user?.data?.id ?? null
      : null;

  const patreonUserId =
    (identity?.id as string | undefined) ??
    (typeof membershipUserId === "string" ? membershipUserId : null) ??
    null;
  const email = identity?.attributes?.email ?? null;
  const status =
    membership?.attributes?.patron_status ??
    membership?.attributes?.last_charge_status ??
    membership?.attributes?.pledge_status ??
    null;
  const tierId =
    membership?.relationships?.currently_entitled_tiers?.data?.[0]?.id ??
    membership?.attributes?.currently_entitled_tier_id ??
    null;
  const entitledCents = membership?.attributes?.currently_entitled_amount_cents ?? null;
  const resolvedCampaignId = membership?.relationships?.campaign?.data?.id ?? null;

  return {
    patreonUserId,
    email: typeof email === "string" ? email : null,
    status: typeof status === "string" ? status : null,
    tierId: typeof tierId === "string" ? tierId : null,
    entitledCents: Number.isFinite(entitledCents) ? Number(entitledCents) : null,
    campaignId: typeof resolvedCampaignId === "string" ? resolvedCampaignId : null,
  } satisfies PatreonMembership;
}

export function determineRoleFromPatreon(options: {
  tierId: string | null;
  currentRole: string | null;
  email: string | null;
  testerTierIds: Set<string>;
  primaryAdminEmail?: string;
}) {
  const { tierId, currentRole, email, testerTierIds } = options;
  const primaryAdminEmail = options.primaryAdminEmail ?? PRIMARY_ADMIN_EMAIL;
  if (
    currentRole === "admin" ||
    (email && email.toLowerCase() === primaryAdminEmail.toLowerCase())
  ) {
    return "admin";
  }
  if (tierId && testerTierIds.has(tierId)) {
    return "tester";
  }
  return "regular";
}

export function sanitizeRedirectPath(raw: string | null | undefined) {
  if (!raw) return "/account";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/account";
}

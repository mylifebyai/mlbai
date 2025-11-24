import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";
import {
  determineRoleFromPatreon,
  fetchPatreonMembership,
  getPatreonConfig,
  refreshAccessToken,
} from "@/lib/patreon";
import { PRIMARY_ADMIN_EMAIL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  patreon_refresh_token: string | null;
  patreon_user_id?: string | null;
  patreon_status?: string | null;
  patreon_tier_id?: string | null;
};

type SyncResult =
  | {
      userId: string;
      status: "ok";
      role: string;
      tierId: string | null;
      patreonStatus: string | null;
    }
  | { userId: string; status: "skipped"; reason: string }
  | { userId: string; status: "error"; error: string };

function isCronRequest(request: Request) {
  return Boolean(request.headers.get("x-vercel-cron"));
}

function authHeaderToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

async function getAuthUser(request: Request) {
  const token = authHeaderToken(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token) return { userId: null, email: null };
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env missing");
  }
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error("Invalid token");
  }
  return { userId: data.user.id, email: data.user.email ?? null };
}

async function syncProfile(
  profile: ProfileRow,
  supabaseAdmin = createSupabaseAdmin(),
  config = getPatreonConfig(),
) {
  if (!profile.patreon_refresh_token) {
    return {
      userId: profile.id,
      status: "skipped" as const,
      reason: "No Patreon refresh token",
    };
  }

  try {
    const tokens = await refreshAccessToken(profile.patreon_refresh_token, config);
    const membership = await fetchPatreonMembership(tokens.accessToken, config.campaignId);
    const nextRole = determineRoleFromPatreon({
      tierId: membership.tierId,
      currentRole: profile.role ?? null,
      email: profile.email,
      testerTierIds: config.testerTierIds,
      primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
    });

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        role: nextRole,
        patreon_user_id: membership.patreonUserId ?? profile.patreon_user_id ?? null,
        patreon_tier_id: membership.tierId,
        patreon_status: membership.status ?? "no_membership",
        patreon_last_sync_at: new Date().toISOString(),
        patreon_refresh_token: tokens.refreshToken ?? profile.patreon_refresh_token,
      })
      .eq("id", profile.id);

    if (error) {
      throw error;
    }

    return {
      userId: profile.id,
      status: "ok" as const,
      role: nextRole,
      tierId: membership.tierId ?? null,
      patreonStatus: membership.status ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    const isInvalid = /invalid_grant|revoked|expired token/i.test(message);

    if (isInvalid) {
      const nextRole = determineRoleFromPatreon({
        tierId: null,
        currentRole: profile.role ?? null,
        email: profile.email,
        testerTierIds: config.testerTierIds,
        primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
      });

      await supabaseAdmin
        .from("profiles")
        .update({
          role: nextRole,
          patreon_status: "revoked",
          patreon_tier_id: null,
          patreon_last_sync_at: new Date().toISOString(),
          patreon_refresh_token: null,
        })
        .eq("id", profile.id);
    } else {
      await supabaseAdmin
        .from("profiles")
        .update({
          patreon_last_sync_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    }

    return { userId: profile.id, status: "error" as const, error: message };
  }
}

export async function GET(request: Request) {
  try {
    const config = getPatreonConfig();
    const supabaseAdmin = createSupabaseAdmin();
    const secret = process.env.PATREON_SYNC_SECRET;
    const token = authHeaderToken(request);

    const isSecretAuthorized = Boolean(secret && token === secret);
    const isCron = isCronRequest(request);

    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    if (!isCron && !isSecretAuthorized) {
      const auth = await getAuthUser(request);
      targetUserId = auth.userId;
      targetEmail = auth.email;
      if (!targetUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const query = supabaseAdmin
      .from("profiles")
      .select("id, email, role, patreon_refresh_token, patreon_user_id, patreon_status, patreon_tier_id");

    if (targetUserId) {
      query.eq("id", targetUserId);
    } else {
      query.not("patreon_refresh_token", "is", null);
    }

    const { data: profiles, error } = await query;
    if (error) {
      throw error;
    }

    const results: SyncResult[] = [];
    for (const profile of profiles as ProfileRow[]) {
      const result = await syncProfile(profile, supabaseAdmin, config);
      results.push(result);
    }

    return NextResponse.json({
      ok: true,
      mode: targetUserId ? "single" : "cron",
      processed: results.length,
      results,
      userEmail: targetEmail,
    });
  } catch (error) {
    console.error("Patreon sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync Patreon memberships." },
      { status: 500 },
    );
  }
}

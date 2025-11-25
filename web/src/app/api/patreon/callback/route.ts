import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  determineRoleFromPatreon,
  exchangeCodeForToken,
  fetchPatreonMembership,
  getPatreonConfig,
  parsePatreonState,
  sanitizeRedirectPath,
} from "@/lib/patreon";
import { PRIMARY_ADMIN_EMAIL } from "@/lib/constants";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawState = url.searchParams.get("state");
  const parsedState = parsePatreonState(rawState);
  const redirectPath = sanitizeRedirectPath(parsedState?.redirectTo ?? null);
  const redirectUrl = new URL(redirectPath, url.origin);

  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    redirectUrl.searchParams.set("patreon", "error");
    redirectUrl.searchParams.set("reason", errorParam);
    return NextResponse.redirect(redirectUrl);
  }

  const code = url.searchParams.get("code");
  if (!code || !parsedState) {
    redirectUrl.searchParams.set("patreon", "error");
    redirectUrl.searchParams.set("reason", "Missing code or state");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const config = getPatreonConfig();
    const tokens = await exchangeCodeForToken(code, config);
    const membership = await fetchPatreonMembership(tokens.accessToken, config.campaignId);

    const mismatchedCampaign =
      !!config.campaignId &&
      !!membership.campaignId &&
      membership.campaignId !== config.campaignId;
    const missingTier = !membership.tierId;

    if (missingTier || mismatchedCampaign) {
      console.warn("Patreon membership incomplete", {
        patreonUserId: membership.patreonUserId,
        status: membership.status,
        tierId: membership.tierId,
        campaignId: membership.campaignId,
        expectedCampaignId: config.campaignId,
      });
      redirectUrl.searchParams.set("patreon", "error");
      redirectUrl.searchParams.set(
        "reason",
        mismatchedCampaign
          ? "Patreon membership is for a different campaign."
          : "No active Patreon membership found for this campaign.",
      );
      return NextResponse.redirect(redirectUrl);
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .eq("id", parsedState.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    const currentRole = existingProfile?.role ?? null;
    const email = existingProfile?.email ?? membership.email ?? null;
    const nextRole = determineRoleFromPatreon({
      tierId: membership.tierId,
      currentRole,
      email,
      testerTierIds: config.testerTierIds,
      primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
    });

    const payload = {
      id: parsedState.userId,
      email,
      role: nextRole,
      patreon_user_id: membership.patreonUserId,
      patreon_tier_id: membership.tierId,
      patreon_status: membership.status ?? "no_membership",
      patreon_last_sync_at: new Date().toISOString(),
      patreon_refresh_token: tokens.refreshToken,
    };

    const upsertResult = await supabaseAdmin.from("profiles").upsert(payload);
    if (upsertResult.error) {
      throw upsertResult.error;
    }

    redirectUrl.searchParams.set("patreon", "linked");
    redirectUrl.searchParams.set("role", nextRole);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Patreon callback failed", error);
    redirectUrl.searchParams.set("patreon", "error");
    redirectUrl.searchParams.set(
      "reason",
      error instanceof Error ? error.message : "Unable to link Patreon.",
    );
    return NextResponse.redirect(redirectUrl);
  }
}

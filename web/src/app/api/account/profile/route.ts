import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const PROFILE_FIELDS =
  "id, email, role, patreon_user_id, patreon_tier_id, patreon_status, patreon_last_sync_at";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authUser, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authUser?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data: existingProfile, error } = await supabaseAdmin
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", authUser.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    let profile = existingProfile;
    if (!profile) {
      const insertResult = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authUser.user.id,
          email: authUser.user.email ?? null,
          role: "regular",
        })
        .select(PROFILE_FIELDS)
        .single();
      if (insertResult.error) {
        throw insertResult.error;
      }
      profile = insertResult.data;
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Account profile fetch failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load profile." },
      { status: 500 },
    );
  }
}

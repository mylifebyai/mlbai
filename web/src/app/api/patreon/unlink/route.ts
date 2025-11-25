import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
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
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", authUser.user.id)
      .maybeSingle();

    const nextRole = existingProfile?.role === "admin" ? "admin" : "regular";
    const { error: upsertError } = await supabaseAdmin.from("profiles").upsert({
      id: authUser.user.id,
      role: nextRole,
      patreon_user_id: null,
      patreon_tier_id: null,
      patreon_status: null,
      patreon_last_sync_at: null,
      patreon_refresh_token: null,
    });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ success: true, role: nextRole });
  } catch (error) {
    console.error("Patreon unlink failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to unlink Patreon." },
      { status: 500 },
    );
  }
}

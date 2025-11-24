import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildPatreonAuthUrl,
  buildPatreonState,
  getPatreonConfig,
  sanitizeRedirectPath,
} from "@/lib/patreon";

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

    const { redirectTo } = await request.json().catch(() => ({}));
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const config = getPatreonConfig();
    const state = buildPatreonState({
      userId: data.user.id,
      redirectTo: sanitizeRedirectPath(typeof redirectTo === "string" ? redirectTo : null),
    });
    const url = buildPatreonAuthUrl(state, config);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Patreon start failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start Patreon link." },
      { status: 500 },
    );
  }
}

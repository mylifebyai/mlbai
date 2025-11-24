import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = new Set(["admin", "tester", "regular"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId : null;
    const email = typeof body.email === "string" ? body.email : null;
    const role =
      typeof body.role === "string" && ALLOWED_ROLES.has(body.role)
        ? body.role
        : "tester";

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
    if (authError || !authUser?.user || authUser.user.id !== userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email, role });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile upsert failed", error);
    return NextResponse.json(
      { error: "Unexpected error upserting profile" },
      { status: 500 },
    );
  }
}

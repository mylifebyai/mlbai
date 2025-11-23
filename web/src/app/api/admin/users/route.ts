import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = new Set(["admin", "tester", "regular"]);

async function requireAdmin(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: NextResponse.json({ error: "Supabase env missing" }, { status: 500 }) };
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return { error: NextResponse.json({ error: "Missing token" }, { status: 401 }) };
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authUser, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !authUser?.user) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authUser.user.id)
    .single();

  if (profileError) {
    console.error("Failed to load profile for admin check", profileError);
    return { error: NextResponse.json({ error: "Profile lookup failed" }, { status: 500 }) };
  }

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabaseAdmin };
}

export async function GET(request: Request) {
  const supabaseAdmin = createSupabaseAdmin();
  const authCheck = await requireAdmin(request);
  if ("error" in authCheck) return authCheck.error;

  // Fetch first page of users (adjust perPage if needed)
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.error("Failed to list users", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = data?.users ?? [];
  const ids = users.map((u) => u.id);
  let profiles: Record<string, string | null> = {};

  if (ids.length > 0) {
    const { data: profileRows, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role");
    if (profileError) {
      console.error("Failed to load profiles for admin list", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    profiles = Object.fromEntries((profileRows ?? []).map((row) => [row.id, row.role as string]));
  }

  const payload = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: profiles[u.id] ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));

  return NextResponse.json({ users: payload });
}

export async function PATCH(request: Request) {
  const supabaseAdmin = createSupabaseAdmin();
  const authCheck = await requireAdmin(request);
  if ("error" in authCheck) return authCheck.error;

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : null;
  const role =
    typeof body.role === "string" && ALLOWED_ROLES.has(body.role) ? body.role : null;
  const email = typeof body.email === "string" ? body.email : null;

  if (!userId || !role) {
    return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
  }

  // Prevent demoting the primary admin (mylife.byai@gmail.com)
  if (email && email.toLowerCase() === "mylife.byai@gmail.com" && role !== "admin") {
    return NextResponse.json({ error: "Cannot change primary admin role" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, role, email }, { onConflict: "id" });

  if (error) {
    console.error("Failed to update user role", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const PRIMARY_ADMIN_EMAIL = "mylife.byai@gmail.com";

async function getUserFromToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error("Invalid or expired token.");
  }
  return data.user;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    if (user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Primary admin account cannot be deleted." },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Delete profile first (soft failure allowed)
    await supabaseAdmin.from("profiles").delete().eq("id", user.id);

    // Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to delete account right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

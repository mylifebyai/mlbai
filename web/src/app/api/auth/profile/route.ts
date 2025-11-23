import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

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

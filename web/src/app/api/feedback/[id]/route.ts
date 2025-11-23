import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { mapRowToEntry, type FeedbackDbRow } from "@/types/feedback";

const TABLE_NAME = "feedback_reports";

async function requireTesterOrAdmin(request: Request, supabaseAdmin = createSupabaseAdmin()) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return { error: NextResponse.json({ error: "Missing token" }, { status: 401 }) };
  }
  const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authUser?.user) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authUser.user.id)
    .single();
  const role = profile?.role;
  if (role !== "admin" && role !== "tester") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabaseAdmin, role, userId: authUser.user.id };
}

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabaseAdmin = createSupabaseAdmin();
  const authCheck = await requireTesterOrAdmin(request, supabaseAdmin);
  if ("error" in authCheck) return authCheck.error;

  const { id } = await params;
  const { status } = await request.json();

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update feedback status", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapRowToEntry(data as FeedbackDbRow));
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabaseAdmin = createSupabaseAdmin();
  const authCheck = await requireTesterOrAdmin(_request, supabaseAdmin);
  if ("error" in authCheck) return authCheck.error;

  const { id } = await params;
  const { error } = await supabaseAdmin.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    console.error("Failed to delete feedback entry", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

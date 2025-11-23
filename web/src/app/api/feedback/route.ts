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

export async function GET() {
  const supabaseAdmin = createSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load feedback entries", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = (data as FeedbackDbRow[] | null)?.map(mapRowToEntry) ?? [];
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const supabaseAdmin = createSupabaseAdmin();
  const authCheck = await requireTesterOrAdmin(request, supabaseAdmin);
  if ("error" in authCheck) return authCheck.error;

  const payload = await request.json();

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert([
      {
        name: payload.name ?? "",
        contact: payload.contact ?? "",
        issue_type: payload.issueType ?? "",
        severity: payload.severity ?? "",
        affected_area: payload.affectedArea ?? "",
        description: payload.description ?? "",
        steps: payload.steps ?? "",
        image: payload.image ?? null,
        image_name: payload.imageName ?? null,
        status: payload.status ?? "todo",
        environment: payload.environment ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Failed to create feedback entry", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapRowToEntry(data as FeedbackDbRow), { status: 201 });
}

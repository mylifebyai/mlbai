import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mapRowToEntry, type FeedbackDbRow } from "@/types/feedback";

const TABLE_NAME = "feedback_reports";

export async function GET() {
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

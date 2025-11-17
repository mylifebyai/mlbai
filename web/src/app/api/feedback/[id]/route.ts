import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mapRowToEntry, type FeedbackDbRow } from "@/types/feedback";

const TABLE_NAME = "feedback_reports";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
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
  const { id } = await params;
  const { error } = await supabaseAdmin.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    console.error("Failed to delete feedback entry", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

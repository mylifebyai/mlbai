import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { WeeklyReview } from "@/lib/productivityTypes";

function getAuthToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token;
}

async function getAuthUser(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env missing");
  }
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error("Invalid token");
  }
  return data.user;
}

export async function GET(request: Request) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const user = await getAuthUser(token);
    const supabaseAdmin = createSupabaseAdmin();

    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart");

    const query = supabaseAdmin.from("productivity_weekly_reviews").select("week_start, week_end, blocks, outputs, relapses, falling_apart, adjustments, next_week_plan");
    query.eq("user_id", user.id);
    if (weekStart) {
      query.eq("week_start", weekStart);
    }
    query.order("week_start", { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({ reviews: data ?? [] });
  } catch (error) {
    console.error("Productivity weekly reviews GET failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load weekly reviews." },
      { status: error instanceof Error && error.message === "Invalid token" ? 401 : 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const user = await getAuthUser(token);
    const supabaseAdmin = createSupabaseAdmin();

    const body = (await request.json()) as { review: WeeklyReview };
    if (!body?.review || typeof body.review !== "object" || !body.review.weekStart) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("productivity_weekly_reviews").upsert(
      {
        user_id: user.id,
        week_start: body.review.weekStart,
        week_end: body.review.weekEnd,
        blocks: body.review.blocks ?? [],
        outputs: body.review.outputs ?? [],
        relapses: body.review.relapses ?? [],
        falling_apart: body.review.fallingApart ?? [],
        adjustments: body.review.adjustments ?? "",
        next_week_plan: body.review.nextWeekPlan ?? null,
      },
      { onConflict: "user_id,week_start" },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Productivity weekly review PUT failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save weekly review." },
      { status: error instanceof Error && error.message === "Invalid token" ? 401 : 500 },
    );
  }
}

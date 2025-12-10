import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { DailyLog } from "@/lib/productivityTypes";

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

    const query = supabaseAdmin.from("productivity_daily_logs").select("date, blocks, relapses, reflection, tokens_earned, tokens_spent, tokens_note, missing_check_in, retroactive");
    if (weekStart) {
      query.gte("date", weekStart);
    }
    query.eq("user_id", user.id).order("date", { ascending: true });

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({ logs: data ?? [] });
  } catch (error) {
    console.error("Productivity daily logs GET failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load daily logs." },
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

    const body = (await request.json()) as { log: DailyLog };
    if (!body?.log || typeof body.log !== "object" || !body.log.date) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("productivity_daily_logs").upsert(
      {
        user_id: user.id,
        date: body.log.date,
        blocks: body.log.blocksCompleted ?? [],
        relapses: body.log.relapses ?? [],
        reflection: body.log.reflection ?? "",
        tokens_earned: body.log.tokensEarned ?? 0,
        tokens_spent: body.log.tokensSpent ?? 0,
        tokens_note: body.log.tokensNote ?? "",
        missing_check_in: body.log.missingCheckIn ?? false,
        retroactive: body.log.retroactive ?? false,
      },
      { onConflict: "user_id,date" },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Productivity daily log PUT failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save daily log." },
      { status: error instanceof Error && error.message === "Invalid token" ? 401 : 500 },
    );
  }
}

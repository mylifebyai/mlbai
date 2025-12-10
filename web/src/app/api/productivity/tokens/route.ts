import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

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

    const { data, error } = await supabaseAdmin
      .from("productivity_tokens")
      .select("timestamp, delta, reason, note")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: true });

    if (error) {
      throw error;
    }

    const balance =
      data?.reduce((acc, row) => {
        return acc + (row?.delta ?? 0);
      }, 0) ?? 0;

    return NextResponse.json({ ledger: data ?? [], balance });
  } catch (error) {
    console.error("Productivity tokens GET failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load token ledger." },
      { status: error instanceof Error && error.message === "Invalid token" ? 401 : 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }
    const user = await getAuthUser(token);
    const supabaseAdmin = createSupabaseAdmin();

    const body = (await request.json()) as { delta: number; reason: string; note?: string; timestamp?: string };
    if (typeof body?.delta !== "number" || !body.reason) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("productivity_tokens").insert({
      user_id: user.id,
      delta: body.delta,
      reason: body.reason,
      note: body.note ?? "",
      timestamp: body.timestamp ?? new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Productivity tokens POST failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save token entry." },
      { status: error instanceof Error && error.message === "Invalid token" ? 401 : 500 },
    );
  }
}

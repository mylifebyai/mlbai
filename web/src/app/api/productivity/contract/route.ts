import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ExperimentContract } from "@/lib/productivityTypes";

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
      .from("productivity_contracts")
      .select("contract, version, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({ contract: data?.contract ?? null, version: data?.version ?? null, updated_at: data?.updated_at ?? null });
  } catch (error) {
    console.error("Productivity contract GET failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load productivity contract." },
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

    const body = (await request.json()) as { contract: ExperimentContract };
    if (!body?.contract || typeof body.contract !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("productivity_contracts").upsert(
      {
        user_id: user.id,
        contract: body.contract,
        version: body.contract.version ?? 1,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Productivity contract PUT failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save productivity contract." },
      { status: error instanceof Error && error.message === "Invalid token" ? 401 : 500 },
    );
  }
}

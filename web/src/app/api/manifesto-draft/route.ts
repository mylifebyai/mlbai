import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

type ManifestoSectionReview = {
  rewrite?: string;
  rating?: number | null;
  rationale?: string;
  questions?: Array<{ id: string; text: string; kind?: "question" | "comment" }>;
  replies?: Array<{ questionId: string; answer: string }>;
  iteration?: number;
  history?: Array<{ iteration?: number; rewrite?: string; rating?: number | null; rationale?: string; updatedAt?: string }>;
};

type ManifestoSectionState = {
  content: string;
  status: "draft" | "in_review" | "complete";
  included?: boolean;
  review?: ManifestoSectionReview;
};

type ManifestoDraftPayload = {
  sections: Record<string, ManifestoSectionState>;
};

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
      .from("manifesto_drafts")
      .select("sections, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      draft: data ?? { sections: {}, updated_at: null },
    });
  } catch (error) {
    console.error("Manifesto draft GET failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load manifesto draft." },
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

    const body = (await request.json()) as ManifestoDraftPayload;
    if (!body?.sections || typeof body.sections !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("manifesto_drafts").upsert(
      {
        user_id: user.id,
        sections: body.sections,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Manifesto draft PUT failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save manifesto draft." },
      { status: error instanceof Error && error.message === "Invalid token" ? 401 : 500 },
    );
  }
}

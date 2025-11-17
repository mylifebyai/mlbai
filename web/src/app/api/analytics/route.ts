import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const TABLE_NAME = "site_events";

type AnalyticsEventPayload = {
  eventType?: string;
  path?: string;
  referrer?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

const MAX_TEXT_LENGTH = 512;

function sanitizeText(value?: string) {
  if (!value || typeof value !== "string") {
    return null;
  }
  return value.slice(0, MAX_TEXT_LENGTH);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AnalyticsEventPayload;

  if (!body.eventType) {
    return NextResponse.json(
      { error: "eventType is required" },
      { status: 400 },
    );
  }

  const headersList = request.headers;
  const forwardedFor = headersList.get("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() ?? headersList.get("x-real-ip");

  const ipHash =
    clientIp && process.env.ANALYTICS_IP_SALT
      ? createHash("sha256")
          .update(`${clientIp}${process.env.ANALYTICS_IP_SALT}`)
          .digest("hex")
      : null;

  const supabaseAdmin = createSupabaseAdmin();

  const { error } = await supabaseAdmin.from(TABLE_NAME).insert({
    event_type: body.eventType,
    path: sanitizeText(body.path ?? "/"),
    referrer: sanitizeText(body.referrer ?? headersList.get("referer") ?? ""),
    user_agent: sanitizeText(body.userAgent),
    metadata: body.metadata ?? null,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("Failed to store analytics event", error);
    return NextResponse.json(
      { error: "Unable to record analytics event" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

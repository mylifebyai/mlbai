import { NextResponse } from "next/server";

type ReviewQuestion = {
  id: string;
  text: string;
  kind: "question" | "comment";
};

type ReviewReply = {
  questionId: string;
  answer: string;
};

type ReviewRequest = {
  sectionId: string;
  sectionTitle?: string;
  content: string;
  replies?: ReviewReply[];
  iteration?: number;
  included?: boolean;
};

type ReviewResponse = {
  questions: ReviewQuestion[];
  rewrite: string;
  rating: number;
  rationale: string;
  iteration: number;
};

function validatePayload(body: unknown): ReviewRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }
  const { sectionId, content, replies, iteration, included, sectionTitle } = body as ReviewRequest;
  if (!sectionId || typeof sectionId !== "string") {
    throw new Error("Missing sectionId");
  }
  if (!content || typeof content !== "string") {
    throw new Error("Missing content");
  }
  if (included === false) {
    throw new Error("Section is not selected for review");
  }
  if (replies && !Array.isArray(replies)) {
    throw new Error("Invalid replies");
  }
  const safeReplies: ReviewReply[] =
    replies?.map((reply) => ({
      questionId: reply?.questionId ?? "",
      answer: reply?.answer ?? "",
    })) ?? [];
  return {
    sectionId,
    content,
    replies: safeReplies,
    iteration: typeof iteration === "number" && iteration > 0 ? iteration : 0,
    included: true,
    sectionTitle,
  };
}

function buildStubResponse(payload: ReviewRequest): ReviewResponse {
  const nextIteration = payload.iteration ? payload.iteration + 1 : 1;
  const questions: ReviewQuestion[] = [
    {
      id: "clarity",
      text: "What feels under-explained or too surface-level here?",
      kind: "question",
    },
    {
      id: "specifics",
      text: "Give 1–2 concrete examples (recent events, patterns, or metrics) that illustrate this section.",
      kind: "question",
    },
    {
      id: "stakes",
      text: "Why does improving this matter right now? What changes if you solve it?",
      kind: "question",
    },
  ];

  const rewriteIntro = payload.sectionTitle
    ? `Rewriting "${payload.sectionTitle}" with more specificity:\n\n`
    : "Rewriting with more specificity:\n\n";
  const rewrite =
    rewriteIntro +
    `${payload.content.trim()}\n\n` +
    "Added depth: highlight concrete examples, daily friction, emotional stakes, and what “better” looks like. Please answer the follow-ups so I can tighten this further.";

  return {
    questions,
    rewrite,
    rating: Math.max(3, Math.min(7, 10 - nextIteration)), // stubbed rating that improves over time
    rationale: "Stubbed: answer the follow-ups with specifics so I can rewrite this to a 10/10.",
    iteration: nextIteration,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = validatePayload(body);
    // GPT call will go here; for now return a deterministic stubbed response.
    const response = buildStubResponse(payload);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to review section.";
    const status = message === "Invalid payload" || message.startsWith("Missing") ? 400 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}

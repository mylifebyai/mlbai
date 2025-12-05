"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../providers/AuthProvider";

type SectionStatus = "draft" | "in_review" | "complete";

type Section = {
  id: string;
  title: string;
  helper: string;
};

type ReviewQuestion = {
  id: string;
  text: string;
  kind: "question" | "comment";
};

type ReviewReply = {
  questionId: string;
  answer: string;
};

type ReviewHistoryItem = {
  iteration: number;
  rewrite: string;
  rating: number | null;
  rationale: string;
  updatedAt: string;
};

type SectionReview = {
  rewrite: string;
  rating: number | null;
  rationale: string;
  questions: ReviewQuestion[];
  replies: ReviewReply[];
  iteration: number;
  history: ReviewHistoryItem[];
};

type SectionState = {
  content: string;
  status: SectionStatus;
  included: boolean;
  review: SectionReview;
};

const sections: Section[] = [
  { id: "physical", title: "Physical Health", helper: "Sleep, energy, medical issues, body signals." },
  { id: "mental", title: "Mental/Emotional Health", helper: "Anxiety, mood, stress patterns." },
  { id: "diet", title: "Diet & Movement", helper: "Food relationship, patterns, binges, exercise." },
  { id: "work", title: "Work & Money", helper: "Direction, progress, spending, debt, guilt." },
  {
    id: "relationships",
    title: "Relationships/Family/Social",
    helper: "Connection, conflict, support, loneliness.",
  },
  { id: "home", title: "Home/Environment", helper: "Organization, stability, safety." },
  { id: "identity", title: "Identity & Purpose", helper: "Who you are, why this matters." },
  { id: "obstacles", title: "Obstacles & Loops", helper: "Triggers, self-sabotage, addictions." },
  { id: "other", title: "Other", helper: "Anything uncaptured elsewhere." },
];

export function BuilderClient() {
  const { session, loading: authLoading } = useAuth();
  const [started, setStarted] = useState(false);
  const defaultReview = useCallback(
    (): SectionReview => ({
      rewrite: "",
      rating: null,
      rationale: "",
      questions: [],
      replies: [],
      iteration: 0,
      history: [],
    }),
    [],
  );
  const normalizeReview = useCallback(
    (incoming?: Partial<SectionReview>): SectionReview => {
      const base = defaultReview();
      if (!incoming) return base;
      return {
        rewrite: incoming.rewrite ?? base.rewrite,
        rating: incoming.rating ?? base.rating,
        rationale: incoming.rationale ?? base.rationale,
        questions: incoming.questions ?? base.questions,
        replies: incoming.replies ?? base.replies,
        iteration: incoming.iteration ?? base.iteration,
        history: incoming.history ?? base.history,
      };
    },
    [defaultReview],
  );
  const [sectionState, setSectionState] = useState<Record<string, SectionState>>(() =>
    sections.reduce(
      (acc, section) => ({
        ...acc,
        [section.id]: { content: "", status: "draft", included: true, review: defaultReview() },
      }),
      {},
    ),
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState<Record<string, boolean>>({});
  const [reviewError, setReviewError] = useState<Record<string, string | null>>({});

  const totalSections = sections.length;
  const selectedSections = useMemo(
    () => sections.filter((section) => (sectionState[section.id]?.included ?? true)).length,
    [sectionState],
  );
  const completed = useMemo(
    () =>
      sections.filter((section) => {
        const state = sectionState[section.id];
        const included = state?.included ?? true;
        return included && state?.status === "complete";
      }).length,
    [sectionState],
  );
  const progressPct = selectedSections === 0 ? 0 : Math.round((completed / selectedSections) * 100);
  const statusLabel = useMemo(() => {
    if (!started) return "Not started";
    if (selectedSections === 0) return "No sections selected";
    if (completed === selectedSections) return "All selected sections ready to draft";
    return `${completed}/${selectedSections} selected sections marked complete`;
  }, [started, completed, selectedSections]);

  const start = () => setStarted(true);
  const reset = () => {
    setStarted(false);
    setHelpOpen(false);
    setLastSaved(null);
    setSectionState(
      sections.reduce(
        (acc, section) => ({
          ...acc,
          [section.id]: { content: "", status: "draft", included: true, review: defaultReview() },
        }),
        {},
      ),
    );
  };

  const updateContent = (id: string, value: string) => {
    setSectionState((prev) => ({ ...prev, [id]: { ...prev[id], content: value } }));
  };

  const updateStatus = (id: string, status: SectionStatus) => {
    setSectionState((prev) => ({ ...prev, [id]: { ...prev[id], status } }));
  };

  const updateIncluded = (id: string, included: boolean) => {
    setSectionState((prev) => ({ ...prev, [id]: { ...prev[id], included } }));
  };

  const updateReply = (sectionId: string, questionId: string, answer: string) => {
    setSectionState((prev) => {
      const current = prev[sectionId] ?? { content: "", status: "draft", included: true, review: defaultReview() };
      const review = normalizeReview(current.review);
      const existing = review.replies.find((r) => r.questionId === questionId);
      const replies = existing
        ? review.replies.map((r) => (r.questionId === questionId ? { ...r, answer } : r))
        : [...review.replies, { questionId, answer }];
      return {
        ...prev,
        [sectionId]: {
          ...current,
          review: { ...review, replies },
        },
      };
    });
  };

  const setReviewState = (
    sectionId: string,
    updater: (current: { review: SectionReview } & SectionState) => SectionState,
  ) => {
    setSectionState((prev) => {
      const current = prev[sectionId] ?? { content: "", status: "draft", included: true, review: defaultReview() };
      return { ...prev, [sectionId]: updater({ ...current, review: normalizeReview(current.review) }) };
    });
  };

  const requestReview = async (sectionId: string) => {
    const sectionMeta = sections.find((s) => s.id === sectionId);
    const state = sectionState[sectionId];
    if (!state?.included) {
      setReviewError((prev) => ({ ...prev, [sectionId]: "Include the section before requesting review." }));
      return;
    }
    if (!state?.content?.trim()) {
      setReviewError((prev) => ({ ...prev, [sectionId]: "Add content before requesting review." }));
      return;
    }

    setReviewLoading((prev) => ({ ...prev, [sectionId]: true }));
    setReviewError((prev) => ({ ...prev, [sectionId]: null }));
    try {
      const res = await fetch("/api/manifesto-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          sectionId,
          sectionTitle: sectionMeta?.title,
          content: state.content,
          replies: state.review?.replies ?? [],
          iteration: state.review?.iteration ?? 0,
          included: state.included,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Review failed");
      }
      const body = (await res.json()) as {
        questions?: ReviewQuestion[];
        rewrite?: string;
        rating?: number;
        rationale?: string;
        iteration?: number;
      };
      setReviewState(sectionId, (current) => {
        const now = new Date().toISOString();
        const review = normalizeReview(current.review);
        const historyEntry = {
          iteration: body.iteration ?? review.iteration + 1,
          rewrite: body.rewrite ?? review.rewrite,
          rating: body.rating ?? review.rating ?? null,
          rationale: body.rationale ?? review.rationale,
          updatedAt: now,
        };
        return {
          ...current,
          review: {
            rewrite: body.rewrite ?? review.rewrite,
            rating: body.rating ?? review.rating,
            rationale: body.rationale ?? review.rationale,
            questions: body.questions ?? review.questions,
            replies: review.replies,
            iteration: body.iteration ?? review.iteration + 1,
            history: [...review.history, historyEntry],
          },
        };
      });
    } catch (err) {
      setReviewError((prev) => ({
        ...prev,
        [sectionId]: err instanceof Error ? err.message : "Unable to run review.",
      }));
    } finally {
      setReviewLoading((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  const mergeDraft = (incoming: Record<string, SectionState> | null | undefined) => {
    if (!incoming) return;
    setSectionState((prev) =>
      sections.reduce((acc, section) => {
        const existing =
          incoming[section.id] ?? prev[section.id] ?? { content: "", status: "draft", included: true };
        const included = existing.included ?? true;
        return {
          ...acc,
          [section.id]: {
            content: existing.content ?? "",
            status: existing.status ?? "draft",
            included,
            review: normalizeReview(existing.review),
          },
        };
      }, {} as Record<string, SectionState>),
    );
  };

  const loadDraft = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingDraft(true);
    setError(null);
    try {
      const res = await fetch("/api/manifesto-draft", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to load draft");
      }
      const body = (await res.json()) as { draft?: { sections?: Record<string, SectionState>; updated_at?: string } };
      mergeDraft(body?.draft?.sections ?? {});
      setLastSaved(body?.draft?.updated_at ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load draft");
    } finally {
      setLoadingDraft(false);
    }
  }, [session?.access_token]);

  const saveDraft = async () => {
    if (!session?.access_token) {
      setError("Sign in to save your draft.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/manifesto-draft", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sections: sectionState }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save draft");
      }
      setLastSaved(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save draft");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (started && session?.access_token) {
      loadDraft();
    }
  }, [started, session?.access_token, loadDraft]);

  return (
    <div className="mb-shell">
      <div className="mb-header">
        <div className="mb-header-main">
          <div>
            <p className="mb-eyebrow">Step 3 — Section drafting</p>
            <p className="mb-status">{statusLabel}</p>
            <div className="mb-progress-wrap">
              <div className="mb-progress-bar">
                <span style={{ width: `${Math.min(100, progressPct)}%` }} />
              </div>
              <span>{selectedSections > 0 ? `${completed}/${selectedSections} complete` : "0 selected"}</span>
            </div>
          </div>
          <div className="mb-actions">
            <span className="mb-badge">Local-only</span>
            <span className="mb-badge">Drafting</span>
            {started ? (
              <>
                <button type="button" onClick={reset} className="mb-btn">
                  Reset
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="mb-btn mb-btn-primary"
                  disabled={saving || authLoading}
                >
                  {saving ? "Saving..." : "Save draft"}
                </button>
              </>
            ) : (
              <button type="button" onClick={start} className="mb-btn mb-btn-primary">
                Start drafting
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="mb-card" style={{ gridColumn: "1 / -1", marginBottom: 0 }}>
          <h3 className="mb-card-title" style={{ marginBottom: 8 }}>
            Sections
          </h3>
            <p className="mb-note">
              Draft each section in your own words. Later, ChatGPT will ask targeted follow-ups and
              suggest rewrites per section. You can mark sections “in review” or “complete” locally.
            </p>
            {loadingDraft && <p className="mb-note">Loading your saved draft...</p>}
            {lastSaved && (
              <p className="mb-note">Last saved: {new Date(lastSaved).toLocaleString()}</p>
            )}
            {error && <p className="mb-note" style={{ color: "#b91c1c" }}>{error}</p>}
            {!session && (
              <p className="mb-note" style={{ color: "#b91c1c" }}>
                Sign in to save and load your draft. Changes stay local otherwise.
              </p>
            )}
          </div>

        <div className="mb-card" style={{ gridColumn: "1 / 2", padding: 0 }}>
          <div
            className="mb-side-cards"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "12px",
              padding: "12px",
            }}
          >
            {sections.map((section) => {
              const state = sectionState[section.id];
              const status = state?.status ?? "draft";
              const included = state?.included ?? true;
              return (
                <div
                  key={section.id}
                  className="mb-card"
                  style={{ boxShadow: "none", opacity: included ? 1 : 0.65 }}
                >
                  <div className="mb-rating" style={{ gap: 8 }}>
                    <header style={{ alignItems: "center" }}>
                      <div>
                        <div className="area-info">{section.title}</div>
                        <div className="area-helper">{section.helper}</div>
                      </div>
                      <span className="mb-tag" style={{ textTransform: "capitalize" }}>
                        {included ? status.replace("_", " ") : "Skipped"}
                      </span>
                    </header>
                    <textarea
                      value={state?.content ?? ""}
                      onChange={(e) => updateContent(section.id, e.target.value)}
                      rows={6}
                      placeholder={included ? "Write your thoughts here..." : "Section skipped for now"}
                      className="mb-textarea"
                      disabled={!included}
                    />
                    {!included && (
                      <p className="mb-note" style={{ marginTop: -4 }}>
                        This section is skipped. Include it to edit and mark progress.
                      </p>
                    )}
                    <div className="mb-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="mb-btn"
                        onClick={() => updateIncluded(section.id, !included)}
                      >
                        {included ? "Skip this section" : "Include this section"}
                      </button>
                      <button
                        type="button"
                        className="mb-btn"
                        onClick={() => updateStatus(section.id, "in_review")}
                        disabled={!included}
                      >
                        Mark in review
                      </button>
                      <button
                        type="button"
                        className="mb-btn mb-btn-primary"
                        onClick={() => updateStatus(section.id, "complete")}
                        disabled={!included}
                      >
                        Mark complete
                      </button>
                    </div>
                    <div className="mb-review">
                      <div className="mb-review-header">
                        <div>
                          <div className="area-info">Review with AI</div>
                          <div className="area-helper">
                            Get follow-ups and a rewrite until it’s a 10/10. Answer questions to improve the draft.
                          </div>
                        </div>
                        <div className="mb-review-rating">
                          <span className="mb-tag">
                            {state.review.rating ? `${state.review.rating}/10` : "Not rated"}
                          </span>
                          {state.review.iteration > 0 && (
                            <span className="mb-tag" style={{ background: "#ecfeff", color: "#0e7490" }}>
                              Iteration {state.review.iteration}
                            </span>
                          )}
                        </div>
                      </div>
                      {reviewError[section.id] && (
                        <p className="mb-note" style={{ color: "#b91c1c" }}>
                          {reviewError[section.id]}
                        </p>
                      )}
                      {state.review.questions.length > 0 && (
                        <div className="mb-review-questions">
                          {state.review.questions.map((q) => {
                            const reply = state.review.replies.find((r) => r.questionId === q.id)?.answer ?? "";
                            return (
                              <div key={q.id} className="mb-question">
                                <p className="mb-question-text">
                                  {q.kind === "comment" ? "Comment" : "Question"}: {q.text}
                                </p>
                                <textarea
                                  className="mb-textarea"
                                  rows={3}
                                  placeholder="Your answer"
                                  value={reply}
                                  onChange={(e) => updateReply(section.id, q.id, e.target.value)}
                                  disabled={!included || reviewLoading[section.id]}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="mb-actions" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="mb-btn"
                          onClick={() => requestReview(section.id)}
                          disabled={!included || reviewLoading[section.id]}
                        >
                          {state.review.iteration > 0 ? "Resubmit for review" : "Review with AI"}
                        </button>
                        <button
                          type="button"
                          className="mb-btn"
                          onClick={() => {
                            updateContent(section.id, state.review.rewrite);
                          }}
                          disabled={!included || !state.review.rewrite}
                        >
                          Use AI rewrite
                        </button>
                      </div>
                      <div className="mb-review-rewrite">
                        <p className="mb-question-text">AI rewrite (editable)</p>
                        <textarea
                          className="mb-textarea"
                          rows={5}
                          value={state.review.rewrite}
                          onChange={(e) =>
                            setReviewState(section.id, (current) => ({
                              ...current,
                              review: { ...current.review, rewrite: e.target.value },
                            }))
                          }
                          placeholder="Request a review to see the AI rewrite. You can edit it directly."
                          disabled={reviewLoading[section.id]}
                        />
                        {state.review.rationale && (
                          <p className="mb-note" style={{ marginTop: 6 }}>
                            Rationale: {state.review.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="mb-side-cards" style={{ gridColumn: "2 / 3", gap: "12px" }}>
          <div className="mb-card">
            <h3 className="mb-card-title">Status</h3>
            <p className="mb-note">{statusLabel}</p>
            <div className="mb-progress-card">
              <div className="meter">
                <span style={{ width: `${Math.min(100, progressPct)}%` }} />
              </div>
              <p className="mb-note" style={{ marginTop: 6 }}>
                {selectedSections > 0
                  ? `${completed}/${selectedSections} selected sections marked complete`
                  : "0 sections selected"}
              </p>
              <p className="mb-note" style={{ marginTop: 4 }}>
                Selected: {selectedSections} / {totalSections} total sections
              </p>
            </div>
          </div>

          <div className="mb-card">
            <h3 className="mb-card-title">What’s next?</h3>
            <ol className="mb-list">
              <li>Draft each section in your own voice.</li>
              <li>Mark sections “in review” or “complete” as you go.</li>
              <li>Later we’ll add AI follow-ups and rewrites per section.</li>
              <li>When all sections are complete, we’ll generate the manifesto.</li>
            </ol>
          </div>

          <div className="mb-card">
            <h3 className="mb-card-title">Sample follow-ups (coming soon)</h3>
            <p className="mb-note">
              We’ll surface AI follow-ups here per section. For now, keep writing and marking
              completion locally.
            </p>
            <div className="mb-actions" style={{ marginTop: 8 }}>
              <button type="button" className="mb-btn" onClick={() => setHelpOpen(!helpOpen)}>
                {helpOpen ? "Hide follow-ups" : "Show follow-ups"}
              </button>
            </div>
            {helpOpen && (
              <ul className="mb-list" style={{ marginTop: 8 }}>
                <li>What triggered this pattern originally?</li>
                <li>What does a “good week” look like here?</li>
                <li>What throws you off more than anything?</li>
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

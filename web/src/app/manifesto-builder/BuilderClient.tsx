"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type Area = { id: string; label: string; helper: string };

type Rating = { importance: number };

type DeepDiveItem = { areaId: string; questions: string[] };

const lifeAreas: Area[] = [
  { id: "physical", label: "Physical Health", helper: "energy, medical issues, body signals" },
  { id: "mental", label: "Mental Health", helper: "anxiety, mood, stress, coping" },
  { id: "diet", label: "Diet & Food", helper: "relationship with food, patterns, binges" },
  { id: "sleep", label: "Sleep", helper: "duration, quality, consistency" },
  { id: "fitness", label: "Exercise / Fitness", helper: "movement, strength, cardio" },
  { id: "productivity", label: "Productivity", helper: "focus, procrastination, execution" },
  { id: "work", label: "Work / Career / Business", helper: "direction, progress, friction" },
  { id: "finances", label: "Finances", helper: "spending, debt, savings, guilt" },
  { id: "relationships", label: "Relationships / Family", helper: "connection, conflict, support" },
  { id: "home", label: "Home Environment", helper: "organization, clutter, safety" },
  { id: "emotional", label: "Emotional Life", helper: "patterns, shame cycles, triggers" },
  { id: "identity", label: "Identity / Purpose", helper: "who you are, why this matters" },
  { id: "creativity", label: "Creativity", helper: "expression, making things, blocked?" },
  { id: "addictions", label: "Addictions / Destructive Behavior", helper: "loops that derail you" },
];

const deepDiveQuestions: Record<string, string[]> = {
  default: [
    "Walk me through the recent history of this area. What’s been happening week to week?",
    "What triggers the hardest moments? What is the loop you fall into?",
    "What would a good week look like if this was working? Be specific.",
  ],
};

const nextId = (() => {
  let counter = 0;
  return () => {
    counter += 1;
    return `msg-${Date.now()}-${counter}`;
  };
})();

export function BuilderClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"idle" | "rating" | "deepDive" | "complete">("idle");
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [tempImportance, setTempImportance] = useState<number | null>(5);
  const [deepQueue, setDeepQueue] = useState<DeepDiveItem[]>([]);
  const [deepIndex, setDeepIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const currentArea = lifeAreas[currentAreaIndex];
  const currentDeep = deepQueue[deepIndex];
  const currentDeepQuestion =
    currentDeep?.questions[questionIndex] ?? deepDiveQuestions.default[questionIndex] ?? null;
  const ratedCount = useMemo(() => Object.keys(ratings).length, [ratings]);
  const totalAreas = lifeAreas.length;
  const ratingProgress = Math.round((ratedCount / totalAreas) * 100);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const startFlow = () => {
    if (started) return;
    setStarted(true);
    setMode("rating");
    setMessages([
      {
        id: nextId(),
        role: "assistant",
        content:
          "Welcome. We’ll scan each life area. Use the rating panel to set Importance and Pain for each area, then continue.",
      },
      {
        id: nextId(),
        role: "assistant",
        content:
          "Once ratings are in, we’ll deep-dive the areas that hurt the most. This is all local for now—no backend yet.",
      },
    ]);
  };

  const reset = () => {
    setMessages([]);
    setStarted(false);
    setMode("idle");
    setRatings({});
    setCurrentAreaIndex(0);
    setTempImportance(5);
    setDeepQueue([]);
    setDeepIndex(0);
    setQuestionIndex(0);
    setUserInput("");
  };

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content }]);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content }]);
  };

  const handleSaveRating = () => {
    if (tempImportance === null || !currentArea) return;
    const updatedRatings = {
      ...ratings,
      [currentArea.id]: { importance: tempImportance },
    };
    setRatings(updatedRatings);
    addUserMessage(`${currentArea.label} — Importance: ${tempImportance}/10.`);
    setTempImportance(null);

    const nextIndex = currentAreaIndex + 1;
    if (nextIndex < lifeAreas.length) {
      const nextArea = lifeAreas[nextIndex];
      const nextDefault = updatedRatings[nextArea.id]?.importance ?? 5;
      setTempImportance(nextDefault);
      setCurrentAreaIndex(nextIndex);
      addAssistantMessage(`Got it. Next: ${nextArea.label}.`);
    } else {
      const queue: DeepDiveItem[] = lifeAreas
        .map((area) => {
          const rating = updatedRatings[area.id];
          const isHigh = rating && rating.importance >= 7;
          if (!isHigh) return null;
          return {
            areaId: area.id,
            questions: deepDiveQuestions[area.id] ?? deepDiveQuestions.default,
          };
        })
        .filter(Boolean) as DeepDiveItem[];

      if (queue.length > 0) {
        setTempImportance(5);
        setDeepQueue(queue);
        setDeepIndex(0);
        setQuestionIndex(0);
        setMode("deepDive");
        addAssistantMessage(
          `Thanks. Let's dig into the toughest areas first. Starting with ${lifeAreas.find((a) => a.id === queue[0].areaId)?.label ?? "this area"}.`,
        );
        addAssistantMessage(queue[0].questions[0]);
      } else {
        setMode("complete");
        setTempImportance(5);
        addAssistantMessage(
          "No high-pain/high-importance areas flagged. We can still draft a manifesto later, but you may want to add more detail.",
        );
      }
    }
  };

  const advanceDeepDive = () => {
    if (!currentDeep) {
      setMode("complete");
      addAssistantMessage("That’s enough for now. Next step will be drafting the manifesto.");
      return;
    }

    const questions = currentDeep.questions ?? deepDiveQuestions.default;
    const nextQuestionIndex = questionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      setQuestionIndex(nextQuestionIndex);
      addAssistantMessage(questions[nextQuestionIndex]);
      return;
    }

    const nextDeepIndex = deepIndex + 1;
    if (nextDeepIndex < deepQueue.length) {
      const nextAreaId = deepQueue[nextDeepIndex].areaId;
      setDeepIndex(nextDeepIndex);
      setQuestionIndex(0);
      addAssistantMessage(
        `Thanks. Next, let's talk about ${lifeAreas.find((a) => a.id === nextAreaId)?.label ?? "this area"}.`,
      );
      addAssistantMessage(deepQueue[nextDeepIndex].questions[0]);
    } else {
      setMode("complete");
      addAssistantMessage(
        "We have enough depth to start drafting. Next steps will hook up generation, refinement, and goals.",
      );
    }
  };

  const handleSend = () => {
    if (!userInput.trim()) return;
    const trimmed = userInput.trim();
    addUserMessage(trimmed);
    setUserInput("");

    if (mode === "deepDive") {
      advanceDeepDive();
    }
  };

  const statusLabel = useMemo(() => {
    if (!started) return "Not started";
    if (mode === "rating")
      return `Rating: ${currentArea?.label ?? ""} (${currentAreaIndex + 1}/${lifeAreas.length})`;
    if (mode === "deepDive") {
      const areaLabel =
        deepQueue.length > 0
          ? lifeAreas.find((a) => a.id === deepQueue[deepIndex]?.areaId)?.label
          : "Deep dive";
      return `Deep dive: ${areaLabel ?? ""}`;
    }
    return "Ready for drafting (next steps)";
  }, [started, mode, currentArea?.label, deepQueue, deepIndex, currentAreaIndex]);

  return (
    <div className="mb-shell">
      <div className="mb-header">
        <div className="mb-header-main">
          <div>
            <p className="mb-eyebrow">Step 2 — Interview flow</p>
            <p className="mb-status">{statusLabel}</p>
            <div className="mb-progress-wrap">
              <div className="mb-progress-bar">
                <span style={{ width: `${Math.min(100, ratingProgress)}%` }} />
              </div>
              <span>
                {ratedCount}/{totalAreas} rated
              </span>
            </div>
          </div>
          <div className="mb-actions">
            <span className="mb-badge">Local-only</span>
            <span className="mb-badge">Flow testing</span>
            {started ? (
              <button type="button" onClick={reset} className="mb-btn">
                Reset
              </button>
            ) : (
              <button type="button" onClick={startFlow} className="mb-btn mb-btn-primary">
                Start interview
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-grid">
        <div className="mb-card mb-transcript-wrap">
          <div className="mb-transcript-header">
            <div>
              <p className="mb-status" style={{ fontSize: "16px", marginBottom: 2 }}>
                Transcript
              </p>
              <small>Answer deep-dive questions here</small>
            </div>
            <span className="mb-tag">{mode === "deepDive" ? "Deep dive" : "Scanning"}</span>
          </div>
          <div ref={listRef} className="mb-transcript">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-bubble ${msg.role === "assistant" ? "assistant" : "user"}`}
              >
                {msg.content}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="mb-bubble assistant">
                Press “Start interview” to begin. Rate areas in the sidebar; deep-dive answers show up
                here.
              </div>
            )}
          </div>

          <div className="mb-input-row">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                mode === "deepDive"
                  ? "Respond to the current deep-dive question..."
                  : "Waiting for ratings. Use the panel on the right."
              }
              disabled={!started || mode !== "deepDive"}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!started || mode !== "deepDive" || !userInput.trim()}
              className="mb-btn mb-btn-primary"
            >
              Send
            </button>
          </div>
          <p className="mb-note">
            Tip: rate each area in the sidebar, then answer deep-dive questions here.
          </p>
        </div>

        <aside className="mb-side-cards">
          <div className="mb-card">
            <h3 className="mb-card-title">How to test</h3>
            <ol className="mb-list">
              <li>Start the interview.</li>
              <li>Rate each area; mark a few as 7+ importance to trigger deep dives.</li>
              <li>Answer the deep-dive questions.</li>
              <li>Confirm it reaches “ready to draft.”</li>
            </ol>
          </div>

          <div className="mb-card mb-progress-card">
            <div className="mb-progress-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="mb-card-title" style={{ marginBottom: 0 }}>
                Progress
              </h3>
              <span className="mb-tag">{ratingProgress}% rated</span>
            </div>
            <p style={{ margin: "4px 0 8px", color: "var(--muted)" }}>{statusLabel}</p>
            <div className="mb-note" style={{ marginTop: 0 }}>
              {mode === "rating" && currentArea
                ? `Rating ${currentArea.label} — ${currentArea.helper}`
                : mode === "deepDive" && currentDeep
                  ? `Deep dive on ${lifeAreas.find((a) => a.id === currentDeep.areaId)?.label ?? "this area"}`
                  : "Waiting to start or ready for next steps."}
            </div>
            <div className="meter">
              <span style={{ width: `${Math.min(100, ratingProgress)}%` }} />
            </div>
          </div>

          <div className="mb-card">
            <h3 className="mb-card-title">Rate this area</h3>
            {mode === "rating" && currentArea ? (
              <div className="mb-rating">
                <header>
                  <div>
                    <div className="area-info">{currentArea.label}</div>
                    <div className="area-helper">{currentArea.helper}</div>
                  </div>
                  <span className="mb-tag">
                    {currentAreaIndex + 1} / {totalAreas}
                  </span>
                </header>
                <div className="mb-slider">
                  <label className="area-helper">Importance (1-10)</label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={tempImportance ?? 5}
                    onChange={(e) => setTempImportance(Number(e.target.value))}
                  />
                  <div className="value">Current: {tempImportance ?? "Pick a value"}</div>
                </div>
                <button type="button" onClick={handleSaveRating} className="mb-btn mb-btn-primary">
                  Save rating &amp; next area
                </button>
              </div>
            ) : (
              <p className="mb-note">Ratings are available during the scan. Start the flow to begin.</p>
            )}
          </div>

          <div className="mb-card">
            <h3 className="mb-card-title">Deep-dive prompt</h3>
            {mode === "deepDive" && currentDeepQuestion ? (
              <p style={{ margin: 0, color: "var(--text)" }}>{currentDeepQuestion}</p>
            ) : (
              <p className="mb-note">After ratings, high-importance areas will trigger deep questions.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

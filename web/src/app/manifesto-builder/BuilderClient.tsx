"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type Area = { id: string; label: string; helper: string };

type Rating = { importance: number; pain: number };

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
  { id: "social", label: "Social Life", helper: "friendships, loneliness, belonging" },
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
  const [tempImportance, setTempImportance] = useState<number | null>(null);
  const [tempPain, setTempPain] = useState<number | null>(null);
  const [deepQueue, setDeepQueue] = useState<DeepDiveItem[]>([]);
  const [deepIndex, setDeepIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const currentArea = lifeAreas[currentAreaIndex];
  const currentDeep = deepQueue[deepIndex];
  const currentDeepQuestion =
    currentDeep?.questions[questionIndex] ?? deepDiveQuestions.default[questionIndex] ?? null;

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
    setTempImportance(null);
    setTempPain(null);
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
    if (tempImportance === null || tempPain === null || !currentArea) return;
    const updatedRatings = {
      ...ratings,
      [currentArea.id]: { importance: tempImportance, pain: tempPain },
    };
    setRatings(updatedRatings);
    addUserMessage(
      `${currentArea.label} — Importance: ${tempImportance}/10, Pain: ${tempPain}/10.`,
    );
    setTempImportance(null);
    setTempPain(null);

    const nextIndex = currentAreaIndex + 1;
    if (nextIndex < lifeAreas.length) {
      setCurrentAreaIndex(nextIndex);
      addAssistantMessage(`Got it. Next: ${lifeAreas[nextIndex].label}.`);
    } else {
      const queue: DeepDiveItem[] = lifeAreas
        .map((area) => {
          const rating = updatedRatings[area.id];
          const isHigh = rating && rating.importance >= 7 && rating.pain >= 7;
          if (!isHigh) return null;
          return {
            areaId: area.id,
            questions: deepDiveQuestions[area.id] ?? deepDiveQuestions.default,
          };
        })
        .filter(Boolean) as DeepDiveItem[];

      if (queue.length > 0) {
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
    if (mode === "rating") return `Rating: ${currentArea?.label ?? ""}`;
    if (mode === "deepDive") {
      const areaLabel =
        deepQueue.length > 0
          ? lifeAreas.find((a) => a.id === deepQueue[deepIndex]?.areaId)?.label
          : "Deep dive";
      return `Deep dive: ${areaLabel ?? ""}`;
    }
    return "Ready for drafting (next steps)";
  }, [started, mode, currentArea?.label, deepQueue, deepIndex]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex h-[70vh] flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Preview</p>
            <p className="text-sm text-gray-700">{statusLabel}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            {!started ? (
              <button
                type="button"
                onClick={startFlow}
                className="rounded bg-amber-600 px-3 py-1 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Start
              </button>
            ) : null}
          </div>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex">
              <div
                className={`max-w-3xl rounded-lg px-3 py-2 text-sm shadow ${
                  msg.role === "assistant"
                    ? "bg-blue-50 text-blue-900"
                    : "ml-auto bg-amber-50 text-amber-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-gray-600">
              Press Start to kick off the interview scaffold. This is local-only for now.
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
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
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!started || mode !== "deepDive" || !userInput.trim()}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Send
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Ratings happen in the panel on the right. The text box is active during deep-dive
            questions.
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Progress</h3>
          <p className="mt-1 text-sm text-gray-700">{statusLabel}</p>
          <div className="mt-2 text-xs text-gray-600">
            {mode === "rating" && currentArea ? (
              <p>
                Rating {currentArea.label}
                <span className="block text-gray-500">{currentArea.helper}</span>
              </p>
            ) : mode === "deepDive" && currentDeep ? (
              <p>
                Deep dive on{" "}
                {lifeAreas.find((a) => a.id === currentDeep.areaId)?.label ?? "this area"}.
              </p>
            ) : (
              <p>Waiting to start or ready for next steps.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Ratings</h3>
          {mode === "rating" && currentArea ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                <span>{currentArea.label}</span>
                <span className="text-xs text-gray-500">{currentArea.helper}</span>
              </div>
              <label className="block text-sm text-gray-700">
                Importance (1-10)
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={tempImportance ?? 5}
                  onChange={(e) => setTempImportance(Number(e.target.value))}
                  className="mt-1 w-full"
                />
                <span className="text-xs text-gray-600">
                  {tempImportance ?? "Pick a value"}
                </span>
              </label>
              <label className="block text-sm text-gray-700">
                Pain (1-10)
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={tempPain ?? 5}
                  onChange={(e) => setTempPain(Number(e.target.value))}
                  className="mt-1 w-full"
                />
                <span className="text-xs text-gray-600">{tempPain ?? "Pick a value"}</span>
              </label>
              <button
                type="button"
                onClick={handleSaveRating}
                className="w-full rounded bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Save rating &amp; continue
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Ratings are available during the scan. Start the flow to begin.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Deep-dive prompt</h3>
          {mode === "deepDive" && currentDeepQuestion ? (
            <p className="mt-2 text-sm text-gray-700">{currentDeepQuestion}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              After ratings, high pain + importance areas will trigger deep questions.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../providers/AuthProvider";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ManifestoSectionState = {
  content: string;
  status: "draft" | "in_review" | "complete";
  included?: boolean;
};

type ManifestoDraftResponse = {
  draft?: {
    sections?: Record<string, ManifestoSectionState>;
    updated_at?: string | null;
  };
  error?: string;
};

const INTRO_MESSAGE =
  "Start drafting your manifesto on the left. I can answer questions, surface patterns, and suggest rewrites based on whatever you write there.";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${role}-${Date.now()}`;
  return { id, role, content };
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMessageContent(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre>${code.replace(/\n/g, "<br />")}</pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}

function extractPlainText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function applyCommand(command: string, value?: string, target?: HTMLElement | null) {
  if (typeof document === "undefined") return;
  target?.focus();
  document.execCommand(command, false, value);
}

export function ManifestoWorkspace() {
  const { session, loading: authLoading } = useAuth();
  const [editorHtml, setEditorHtml] = useState("");
  const [lastSavedHtml, setLastSavedHtml] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([createMessage("assistant", INTRO_MESSAGE)]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const liveEditorHtml = editorRef.current?.innerHTML ?? editorHtml;
    const liveEditorText = editorRef.current?.innerText ?? extractPlainText(editorHtml);
    if (liveEditorHtml !== editorHtml) {
      setEditorHtml(liveEditorHtml);
    }

    const userMessage = createMessage("user", input.trim());
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/manifesto-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          manifestoHtml: liveEditorHtml,
          manifestoText: liveEditorText,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = (await response.json()) as { assistantMessage?: string };
      const assistantReply =
        data.assistantMessage ??
        "I’m here to help you iterate. Share what you want to explore, or tell me where the manifesto feels thin.";

      setMessages((prev) => [...prev, createMessage("assistant", assistantReply)]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        createMessage(
          "assistant",
          "I couldn’t reach the assistant just now. Check your connection or try again in a moment.",
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleEditorInput = (event: FormEvent<HTMLDivElement>) => {
    setEditorHtml((event.target as HTMLDivElement).innerHTML);
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey) {
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        applyCommand("bold", undefined, editorRef.current);
      } else if (event.key.toLowerCase() === "i") {
        event.preventDefault();
        applyCommand("italic", undefined, editorRef.current);
      } else if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        applyCommand("underline", undefined, editorRef.current);
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        applyCommand("insertUnorderedList", undefined, editorRef.current);
      }
    }
  };

  const handleClear = () => {
    setEditorHtml("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      editorRef.current.focus();
    }
  };

  const loadDraft = async () => {
    if (!session?.access_token || loadingDraft) return;
    setLoadingDraft(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/manifesto-draft", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ManifestoDraftResponse;
        throw new Error(data?.error ?? "Unable to load draft");
      }
      const data = (await res.json()) as ManifestoDraftResponse;
      const sections = data?.draft?.sections ?? {};
      const existing = sections.full_manifesto?.content ?? "";
      const hasLocalContent = extractPlainText(editorHtml).length > 0;
      // Avoid clobbering unsaved local content if the server is empty.
      if (!(hasLocalContent && !existing)) {
        setEditorHtml(existing);
        if (editorRef.current) {
          editorRef.current.innerHTML = existing;
        }
      }
      setLastSavedHtml(existing);
    } catch (error) {
      console.error(error);
      setSaveError(error instanceof Error ? error.message : "Failed to load manifesto draft.");
    } finally {
      setLoadingDraft(false);
      setHasLoadedDraft(true);
    }
  };

  useEffect(() => {
    if (!session?.access_token || authLoading || hasLoadedDraft) return;
    void loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, authLoading, hasLoadedDraft]);

  useEffect(() => {
    if (!session?.access_token || !hasLoadedDraft) return;
    if (editorHtml === lastSavedHtml) return;
    setSaveState("saving");
    setSaveError(null);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/manifesto-draft", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sections: {
              full_manifesto: {
                content: editorHtml,
                status: "draft",
                included: true,
              } satisfies ManifestoSectionState,
            },
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data?.error ?? "Unable to save manifesto draft.");
        }
        setLastSavedHtml(editorHtml);
        setSaveState("saved");
      } catch (error) {
        console.error(error);
        setSaveError(error instanceof Error ? error.message : "Failed to save.");
        setSaveState("error");
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [editorHtml, hasLoadedDraft, lastSavedHtml, session?.access_token]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-white to-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-10">
        <header className="rounded-3xl border border-amber-100 bg-white/80 p-6 shadow-xl shadow-amber-100/50 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Manifesto Lab</p>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Write it. Stress-test it. Own it.</h1>
              <p className="max-w-3xl text-base text-gray-700">
                Keep the living draft on the left; ask the assistant on the right to push, clarify, or rewrite based on
                exactly what you&apos;ve written. Autosaves while you type.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs text-amber-800">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Draft space
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 font-semibold text-amber-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Assistant online
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <section className="rounded-3xl border border-amber-100 bg-white/90 p-6 shadow-xl shadow-amber-100/50 backdrop-blur">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Your manifesto</span>
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Living draft</h2>
                <p className="text-sm text-gray-600">
                  Go long. Use bold/italic/bullets. I&apos;ll keep an autosaved version synced to your account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-800 hover:shadow"
              >
                Clear
              </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs font-semibold text-amber-800">
              <span className="uppercase tracking-wide text-amber-700">Format</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyCommand("bold", undefined, editorRef.current)}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-1 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow"
                >
                  Bold (⌘/Ctrl+B)
                </button>
                <button
                  type="button"
                  onClick={() => applyCommand("italic", undefined, editorRef.current)}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-1 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow"
                >
                  Italic (⌘/Ctrl+I)
                </button>
                <button
                  type="button"
                  onClick={() => applyCommand("underline", undefined, editorRef.current)}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-1 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow"
                >
                  Underline (⌘/Ctrl+U)
                </button>
                <button
                  type="button"
                  onClick={() => applyCommand("insertUnorderedList", undefined, editorRef.current)}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-1 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow"
                >
                  Bullets (⌘/Ctrl+M)
                </button>
                <button
                  type="button"
                  onClick={() => applyCommand("formatBlock", "<h3>", editorRef.current)}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-1 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow"
                >
                  Heading
                </button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-inner shadow-amber-100/60">
              {editorHtml.trim().length === 0 && (
                <div className="pointer-events-none absolute inset-0 select-none px-4 py-3 text-sm text-gray-400">
                  Start drafting your manifesto here. Add headings, bullets, or free-form narrative.
                </div>
              )}
              <div
                ref={editorRef}
                className="min-h-[500px] w-full resize-y overflow-auto px-5 py-4 text-base leading-7 text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                aria-label="Manifesto rich text editor"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex flex-col gap-1">
                <span>Rich text is shared with the assistant as HTML + plain text for the best context.</span>
                {session?.access_token ? (
                  <span className="text-amber-700">
                    {loadingDraft && "Loading draft…"}
                    {saveState === "saving" && "Saving…"}
                    {saveState === "saved" && "Saved to your account."}
                    {saveState === "error" && "Save failed — retrying after your next edit."}
                  </span>
                ) : (
                  <span className="text-amber-700">Sign in to save your draft to your account.</span>
                )}
                {saveError && <span className="text-red-600">{saveError}</span>}
              </div>
              <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 font-semibold text-amber-800">
                {extractPlainText(editorHtml).split(" ").filter(Boolean).length} words
              </span>
            </div>
          </section>

          <section className="flex min-h-[580px] flex-col rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-xl shadow-amber-100/50 backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Chat assistant</span>
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Ask about your manifesto</h2>
                <p className="text-sm text-gray-600">
                  The assistant reads your draft to answer questions, spot gaps, and suggest improvements. It will nudge
                  you to write if the draft is empty.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live
              </div>
            </div>

            <div className="flex min-h-0 max-h-[75vh] flex-1 flex-col rounded-2xl border border-gray-100 bg-gradient-to-b from-white/80 to-amber-50/60 shadow-inner shadow-amber-50/60">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                        message.role === "assistant"
                          ? "bg-white text-amber-900 ring-1 ring-amber-100"
                          : "bg-gray-900 text-white shadow-amber-200/40"
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-gray-100 bg-white/80 px-4 py-4">
                <label className="sr-only" htmlFor="manifesto-chat-input">
                  Ask the manifesto assistant
                </label>
                <textarea
                  id="manifesto-chat-input"
                  className="h-28 w-full resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm leading-6 text-gray-900 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
                  placeholder="Ask for feedback, clarifications, or a rewrite… (⌘/Ctrl + Enter to send)"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                  <span>Assistant sees your latest editor content each time you send.</span>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending || !input.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-200"
                  >
                    {isSending ? "Thinking…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import type { FeedbackEntry, FeedbackStatus } from "@/types/feedback";
import { RequireAuth } from "../components/RequireAuth";

const initialForm = {
  name: "",
  contact: "",
  issueType: "Bug",
  severity: "Medium",
  affectedArea: "",
  description: "",
  steps: "",
};

export default function FeedbackPage() {
  const [form, setForm] = useState(initialForm);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [imageData, setImageData] = useState<{ src: string; name: string }>();
  const [dropActive, setDropActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lanesOpen, setLanesOpen] = useState<{ todo: boolean; complete: boolean }>({
    todo: true,
    complete: false,
  });
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<FeedbackStatus | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch("/api/feedback", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load feedback entries.");
        }
        const data: FeedbackEntry[] = await response.json();
        setEntries(data);
        setEntriesError(null);
      } catch (err) {
        console.error(err);
        setEntriesError("Unable to load submissions. Refresh to try again.");
      } finally {
        setEntriesLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Only image uploads are supported right now.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData({
        src: reader.result as string,
        name: file.name,
      });
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropActive(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.description.trim()) {
      setFormError("Please add a short summary of the issue.");
      return;
    }
    const payload = {
      ...form,
      image: imageData?.src ?? null,
      imageName: imageData?.name ?? null,
      status: "todo" as FeedbackStatus,
      environment: {
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
        viewport:
          typeof window !== "undefined"
            ? `${window.innerWidth}×${window.innerHeight}`
            : "Unknown",
      },
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to submit feedback.");
      }
      const newEntry: FeedbackEntry = await response.json();
      setEntries((prev) => [newEntry, ...prev]);
      setForm(initialForm);
      setImageData(undefined);
      setFormError(null);
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshEntry = (updatedEntry: FeedbackEntry) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)),
    );
  };

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      const updatedEntry: FeedbackEntry = await response.json();
      refreshEntry(updatedEntry);
      setEntriesError(null);
    } catch (err) {
      console.error(err);
      setEntriesError("Unable to update status. Refresh and try again.");
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setEntriesError(null);
    } catch (err) {
      console.error(err);
      setEntriesError("Unable to delete entry. Refresh and try again.");
    }
  };

  const stats = useMemo(() => {
    const todos = entries.filter((entry) => entry.status === "todo");
    const done = entries.filter((entry) => entry.status === "complete");
    return { todos, done };
  }, [entries]);

  const handleToggleLane = (lane: FeedbackStatus) => {
    setLanesOpen((prev) => ({
      ...prev,
      [lane]: !prev[lane],
    }));
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragTarget(null);
  };

  const handleDragOverLane =
    (lane: FeedbackStatus) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (dragTarget !== lane) {
      setDragTarget(lane);
    }
  };

  const handleDropOnLane =
    (lane: FeedbackStatus) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggingId) {
      updateStatus(draggingId, lane);
    }
    setDraggingId(null);
    setDragTarget(null);
  };

  const renderEntryCard = (entry: FeedbackEntry) => (
    <li
      key={entry.id}
      className={`feedback-card ${draggingId === entry.id ? "feedback-card-dragging" : ""}`}
      draggable
      onDragStart={() => handleDragStart(entry.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="feedback-card-head">
        <div>
          <p className="feedback-card-title">{entry.description}</p>
          <p className="feedback-meta">
            {entry.issueType} · {entry.severity} · {new Date(entry.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={`status-pill status-pill-${entry.status}`}>
          {entry.status === "todo" ? "To Do" : "Complete"}
        </span>
      </div>
      <button
        type="button"
        className={`feedback-card-expander ${expandedEntries[entry.id] ? "is-open" : ""}`}
        onClick={() =>
          setExpandedEntries((prev) => ({
            ...prev,
            [entry.id]: !prev[entry.id],
          }))
        }
        aria-expanded={Boolean(expandedEntries[entry.id])}
        aria-label={`${expandedEntries[entry.id] ? "Hide" : "Show"} details`}
      >
        <span className="expander-line" aria-hidden="true" />
        <span className="expander-circle" aria-hidden="true">
          <span className="expander-arrow">{expandedEntries[entry.id] ? "↑" : "↓"}</span>
        </span>
      </button>
      {expandedEntries[entry.id] && (
        <>
          <div className="feedback-card-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => updateStatus(entry.id, entry.status === "todo" ? "complete" : "todo")}
            >
              Mark {entry.status === "todo" ? "Complete" : "To Do"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => deleteEntry(entry.id)}>
              Delete
            </button>
          </div>
          <dl className="feedback-details">
            {entry.affectedArea && (
              <>
                <dt>Affected area</dt>
                <dd>{entry.affectedArea}</dd>
              </>
            )}
            {entry.steps && (
              <>
                <dt>Steps</dt>
                <dd>{entry.steps}</dd>
              </>
            )}
            {entry.name && (
              <>
                <dt>Reporter</dt>
                <dd>
                  {entry.name}{" "}
                  {entry.contact && <span className="feedback-contact">({entry.contact})</span>}
                </dd>
              </>
            )}
            {!entry.name && entry.contact && (
              <>
                <dt>Contact</dt>
                <dd>{entry.contact}</dd>
              </>
            )}
            <dt>Environment</dt>
            <dd>
              {entry.environment.browser}
              <br />
              Viewport: {entry.environment.viewport}
            </dd>
          </dl>
          {entry.image && (
            <div className="feedback-image">
              <img src={entry.image} alt={entry.imageName ?? "Uploaded screenshot"} />
              {entry.imageName && <p>{entry.imageName}</p>}
            </div>
          )}
        </>
      )}
    </li>
  );

  const renderLane = (lane: FeedbackStatus, label: string, items: FeedbackEntry[]) => (
    <div
      className={`feedback-lane ${
        lanesOpen[lane] ? "is-open" : ""
      } ${dragTarget === lane ? "is-drag-target" : ""}`}
      onDragOver={handleDragOverLane(lane)}
      onDragLeave={() => setDragTarget(null)}
      onDrop={handleDropOnLane(lane)}
    >
      <button
        type="button"
        className="feedback-lane-header"
        onClick={() => handleToggleLane(lane)}
        aria-expanded={lanesOpen[lane]}
      >
        <div>
          <strong>{label}</strong>
          <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
        </div>
        <span className="feedback-lane-toggle">{lanesOpen[lane] ? "−" : "+"}</span>
      </button>
      {lanesOpen[lane] ? (
        items.length > 0 ? (
          <ul className="feedback-list">{items.map((entry) => renderEntryCard(entry))}</ul>
        ) : (
          <p className="empty-state">Nothing here yet.</p>
        )
      ) : (
        <p className="feedback-lane-collapsed-hint">Collapsed — drag items here to move them.</p>
      )}
    </div>
  );

  return (
    <RequireAuth
      title="Log in to submit feedback"
      description="The feedback lab is for members actively testing MLBAI experiments."
      redirectTo="/feedback"
      requirePatron
      patronMessage="Only current Patreon supporters can drop bug reports and experiment notes."
    >
      <main className="feedback-page">
      <div className="wrapper app-shell">
        <div className="feedback-back">
          <Link href="/" className="feedback-back-link" aria-label="Back to home">
            ← Back to My Life, By AI
          </Link>
        </div>
        <section className="feedback-hero">
          <div className="feedback-hero-text">
            <p className="hero-eyebrow">Lab testing hub</p>
            <h1>Log issues, attach context, and keep score.</h1>
            <p>
              This space lets internal testers drop screenshots and notes without
              needing a full login system yet. We&apos;ll wire these submissions
              into Supabase/Auth once you&apos;re ready for persistent,
              multi-user tracking.
            </p>
          </div>
          <div className="feedback-stats-card">
            <div>
              <span>Open issues</span>
              <strong>{stats.todos.length}</strong>
            </div>
            <div>
              <span>Resolved</span>
              <strong>{stats.done.length}</strong>
            </div>
          </div>
        </section>

        <section className="feedback-grid">
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="feedback-form-header">
              <h2>Submit an issue</h2>
              <p>
                Add context so we can recreate the problem quickly. Include page
                links, what you expected to happen, and any screenshots.
              </p>
            </div>

            <div className="input-group">
              <label htmlFor="name">Your name (optional)</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Test Lead A"
              />
            </div>

            <div className="input-group">
              <label htmlFor="contact">Contact or Discord handle</label>
              <input
                id="contact"
                type="text"
                value={form.contact}
                onChange={(event) =>
                  setForm({ ...form, contact: event.target.value })
                }
                placeholder="@tester or email"
              />
            </div>

            <div className="field-row">
              <div className="input-group">
                <label htmlFor="issue-type">Issue type</label>
                <select
                  id="issue-type"
                  value={form.issueType}
                  onChange={(event) =>
                    setForm({ ...form, issueType: event.target.value })
                  }
                >
                  <option>Bug</option>
                  <option>UI</option>
                  <option>Content</option>
                  <option>Performance</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="severity">Severity</label>
                <select
                  id="severity"
                  value={form.severity}
                  onChange={(event) =>
                    setForm({ ...form, severity: event.target.value })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="affectedArea">Affected page or feature</label>
              <input
                id="affectedArea"
                type="text"
                value={form.affectedArea}
                onChange={(event) =>
                  setForm({ ...form, affectedArea: event.target.value })
                }
                placeholder="e.g. Promptly onboarding modal"
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">What happened?</label>
              <textarea
                id="description"
                value={form.description}
                required
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Share a quick summary of the issue"
              />
            </div>

            <div className="input-group">
              <label htmlFor="steps">Steps to reproduce</label>
              <textarea
                id="steps"
                value={form.steps}
                onChange={(event) =>
                  setForm({ ...form, steps: event.target.value })
                }
                placeholder="1) Visit /promptly 2) Click …"
              />
            </div>

            <div
              className={`dropzone ${dropActive ? "dropzone-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDropActive(false);
              }}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                id="screenshot"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <label htmlFor="screenshot">
                <strong>Drop a screenshot</strong> or click to upload
              </label>
              {imageData && (
                <div className="dropzone-preview">
                  <img src={imageData.src} alt={imageData.name} />
                  <div>
                    <p>{imageData.name}</p>
                    <button
                      type="button"
                      onClick={() => setImageData(undefined)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit issue"}
            </button>
          </form>

          <div className="feedback-admin">
            <div className="feedback-form-header">
              <h2>Admin review</h2>
              <p>
                Drag cards between To Do and Complete, or collapse a lane when you
                need more space.
              </p>
            </div>
            {entriesError && <p className="form-error">{entriesError}</p>}
            {entriesLoading ? (
              <p className="empty-state">Loading submissions…</p>
            ) : entries.length === 0 ? (
              <p className="empty-state">
                No submissions yet. Ask your testers to use the floating “Report an
                issue” button.
              </p>
            ) : (
              <div className="feedback-lanes">
                {renderLane("todo", "To Do", stats.todos)}
                {renderLane("complete", "Complete", stats.done)}
              </div>
            )}
          </div>
        </section>

      </div>
      </main>
    </RequireAuth>
  );
}

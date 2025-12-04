import { notFound } from "next/navigation";
import Link from "next/link";
import { BuilderClient } from "./BuilderClient";
import "./manifesto-builder.css";

const isEnabled = process.env.NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED === "true";

export const metadata = {
  title: "Manifesto Builder | My Life, By AI",
  description: "Scoped preview area for the Manifesto Builder module.",
};

export default function ManifestoBuilderPage() {
  if (!isEnabled) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
          Manifesto Builder
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">In-progress workspace</h1>
        <p className="text-base text-gray-700">
          This page scaffolds the Manifesto Builder module. It is behind the feature flag
          <code className="ml-1 rounded bg-gray-100 px-1 py-0.5 text-sm">NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED</code>
          and should only be enabled on preview/staging until the flow is complete.
        </p>
        <p className="text-sm text-gray-600">
          Full product spec: <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">docs/manifesto-builder-spec.md</code>
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold">Current step</h2>
        <p className="mt-2 text-gray-700">
          Step 1 — scaffold the route and layout with gating. Next steps will add the interview UI,
          storage, manifesto generation, refinement, goals/trackers, and PDF export.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Feature flag enabled</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Preview only</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">Work-in-progress</span>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Build checklist</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-700">
          <li>Chat interview UI + local state machine (no backend yet).</li>
          <li>Persist drafts and conversation logs to the backend (user-owned).</li>
          <li>Generate 2–3k word manifesto and render in the UI.</li>
          <li>Refinement loop: edits/rewrites until user approves.</li>
          <li>Goals, trackers, and mandatory habits generation with review UI.</li>
          <li>PDF export (manifesto + goals + trackers + habits).</li>
          <li>Polish: privacy messaging, loading/empty states, navigation entry, QA.</li>
        </ol>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Environment setup</h3>
        <p className="mt-2 text-gray-700">
          To view this page, set{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED=true</code>{" "}
          in your environment. Keep Production and Preview env vars separate in Vercel; only enable the
          feature flag in Preview/Staging until launch.
        </p>
        <p className="mt-2 text-gray-700">
          Preview OAuth redirect for Patreon on this branch:{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
            https://mlbai-git-feature-manifesto-builder-mlbais-projects.vercel.app/api/patreon/callback
          </code>
          .
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Need more context?{" "}
          <Link
            href="https://github.com/mylifebyai/mlbai/blob/feature/manifesto-builder/docs/manifesto-builder-spec.md"
            className="text-blue-700 underline"
          >
            Open the full spec on GitHub
          </Link>
          .
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Interactive scaffold (Step 2 — flow test)</h3>
        <p className="mt-2 text-gray-700">
          Chat-style interview UI with a local-only state machine. Ratings drive which areas get
          deep-dive questions. No backend calls yet—this is just the UX skeleton for testing flow and
          pacing.
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Please run the full scan, mark a few high pain/importance areas, answer the deep-dive prompts,
          and confirm it reaches the “ready to draft” state. UI polish will come later.
        </p>
        <div className="mt-4">
          <BuilderClient />
        </div>
      </section>
    </main>
  );
}

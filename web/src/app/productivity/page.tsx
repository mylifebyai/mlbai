import { notFound } from "next/navigation";

const isEnabled = process.env.NEXT_PUBLIC_PRODUCTIVITY_ENABLED === "true";

export const metadata = {
  title: "Productivity | My Life, By AI",
  description: "30-day productivity cockpit powered by the MLBAI ruleset.",
};

export default function ProductivityPage() {
  if (!isEnabled) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Productivity</p>
        <h1 className="text-3xl font-bold sm:text-4xl">30-day experiment workspace</h1>
        <p className="text-base text-gray-700">
          This page will run the MLBAI Productivity Ruleset: set your SP plan, log daily check-ins, track
          relapses/tokens/outputs, and run weekly reviews with the AI coach.
        </p>
        <p className="text-sm text-gray-600">
          Feature flag: <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_PRODUCTIVITY_ENABLED</code>
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold">Contract setup</h2>
        <p className="mt-2 text-gray-700">
          Capture your SP blocks or weekly SP targets, outputs, relapse rules (including punishments),
          optional tokens, and “Life Is Falling Apart” tracking. This becomes your 30-day experiment contract.
        </p>
      </section>

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold">Dashboard</h3>
          <p className="mt-2 text-gray-700">
            Daily view: planned blocks, SPs completed, remaining strikes, outputs progress, tokens (if enabled),
            and falling-apart notes.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Daily check-in</h3>
          <p className="mt-2 text-gray-700">
            Log SPs completed, relapses (type + note), and a reflection. Missing a check-in auto-counts as a relapse;
            retrofilling a day in the current week also costs a relapse.
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold">Weekly review</h3>
          <p className="mt-2 text-gray-700">
            Sunday review: planned vs completed SPs, outputs hit/missed, relapse counts, falling-apart list, tokens.
            Approve adjustments to SP allocation/rules/targets/rewards only after the review.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI coach</h3>
          <p className="mt-2 text-gray-700">
            Arthur guides setup, daily logging, and weekly adjustments. No invented facts—missing data becomes questions
            or placeholders like [Need detail on X].
          </p>
        </div>
      </section>
    </main>
  );
}

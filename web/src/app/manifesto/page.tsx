import { notFound } from "next/navigation";

const isEnabled = process.env.NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED === "true";

export const metadata = {
  title: "Manifesto | My Life, By AI",
  description: "Manifesto workspace placeholder.",
};

export default function ManifestoPage() {
  if (!isEnabled) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Manifesto</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Manifesto workspace</h1>
        <p className="text-base text-gray-700">
          This page is intentionally empty so we can rebuild the manifesto experience from scratch.
        </p>
      </header>
    </main>
  );
}

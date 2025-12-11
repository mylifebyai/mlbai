import { notFound } from "next/navigation";
import { ManifestoWorkspace } from "./ManifestoWorkspace";

const isEnabled = process.env.NEXT_PUBLIC_MANIFESTO_BUILDER_ENABLED === "true";

export const metadata = {
  title: "Manifesto | My Life, By AI",
  description: "Draft and refine your manifesto with AI support.",
};

export default function ManifestoPage() {
  if (!isEnabled) {
    notFound();
  }

  return <ManifestoWorkspace />;
}

import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

const DOCS_DIR = path.join(process.cwd(), "..", "docs");

type DocSummary = {
  slug: string;
  title: string;
  summary: string;
};

async function getDocsIndex(): Promise<DocSummary[]> {
  try {
    const entries = await fs.readdir(DOCS_DIR);
    const mdFiles = entries.filter((file) => file.toLowerCase().endsWith(".md"));

    const summaries = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.readFile(filePath, "utf8");
        const slug = file.replace(/\.md$/i, "");
        const title = extractHeading(content) ?? prettifySlug(slug);
        const summary = extractSummary(content);
        return { slug, title, summary };
      }),
    );

    return summaries.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error("Failed to load docs index", error);
    return [];
  }
}

function extractHeading(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractSummary(content: string): string {
  const cleaned = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Skip the first heading line for the snippet.
  const startIndex = cleaned[0]?.startsWith("#") ? 1 : 0;
  const snippet = cleaned.slice(startIndex).find((line) => !!line) ?? "";
  return snippet.slice(0, 180);
}

function prettifySlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const dynamic = "force-dynamic";

export default async function DocsIndexPage() {
  const docs = await getDocsIndex();

  return (
    <main className="docs-page">
      <section className="wrapper app-shell docs-shell">
        <header className="docs-hero">
          <div>
            <p className="hero-eyebrow">Documentation</p>
            <h1>Project docs</h1>
            <p className="docs-lead">
              Browse the Markdown files stored in the repo&apos;s docs folder, rendered with
              clean typography so you don&apos;t have to read raw Markdown.
            </p>
          </div>
        </header>

        {docs.length === 0 ? (
          <div className="docs-empty">No Markdown files found in the docs folder.</div>
        ) : (
          <div className="docs-grid">
            {docs.map((doc) => (
              <Link key={doc.slug} href={`/docs/${doc.slug}`} className="doc-card">
                <div className="doc-card-eyebrow">Markdown</div>
                <h2 className="doc-card-title">{doc.title}</h2>
                <p className="doc-card-summary">
                  {doc.summary || "Open to view the full document."}
                </p>
                <span className="doc-card-link">Read document →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

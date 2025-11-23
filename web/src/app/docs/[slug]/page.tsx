import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DOCS_DIR = path.join(process.cwd(), "..", "docs");

type DocFile = {
  title: string;
  content: string;
};

function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9-_]/g, "");
}

function prettifySlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractHeading(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

async function loadDoc(slug: string): Promise<DocFile | null> {
  const safeSlug = sanitizeSlug(slug);
  if (!safeSlug) return null;

  const filePath = path.join(DOCS_DIR, `${safeSlug}.md`);
  try {
    const content = await fs.readFile(filePath, "utf8");
    const title = extractHeading(content) ?? prettifySlug(safeSlug);
    return { title, content };
  } catch (error) {
    console.error(`Doc not found for slug "${slug}"`, error);
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const doc = await loadDoc(params.slug);
  if (!doc) {
    return { title: "Document not found" };
  }
  return { title: `${doc.title} – Docs` };
}

export default async function DocPage({ params }: { params: { slug: string } }) {
  const doc = await loadDoc(params.slug);
  if (!doc) {
    notFound();
  }

  return (
    <main className="docs-page">
      <section className="wrapper app-shell docs-shell">
        <div className="docs-back">
          <Link href="/docs" className="docs-back-link" aria-label="Back to docs index">
            ← Back to docs
          </Link>
        </div>

        <article className="doc-article">
          <header className="doc-article-header">
            <span className="doc-badge">Markdown</span>
            <h1>{doc.title}</h1>
          </header>

          <div className="doc-body doc-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
          </div>
        </article>
      </section>
    </main>
  );
}

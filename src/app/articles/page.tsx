import { getPublishedArticles, getAllTags } from "@/app/lib/articles";
import { readingTime } from "@/app/lib/markdown";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
  description: "Notes on cloud security, detection engineering, and the discipline of building things that hold.",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

const tagPill = (tag: string, active: boolean) => ({
  display: "inline-block" as const,
  fontFamily: "var(--font-geist-mono, monospace)",
  fontSize: 11,
  letterSpacing: "0.06em",
  padding: "4px 10px",
  borderRadius: 2,
  border: `1px solid ${active ? "var(--green)" : "var(--rule)"}`,
  color: active ? "var(--green)" : "var(--muted)",
  background: active ? "rgba(47,74,62,0.06)" : "transparent",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
});

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag: activeTag } = await searchParams;
  const [articles, allTags] = await Promise.all([
    getPublishedArticles(activeTag),
    getAllTags(),
  ]);

  return (
    <main style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      <div className="page-pad" style={{ maxWidth: 760, margin: "0 auto", padding: "64px 32px 140px" }}>
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>← back</Link>
        </div>

        <div style={{ fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green)", fontWeight: 500, marginBottom: 22, fontFamily: "var(--font-geist-sans, sans-serif)" }}>
          Writing
        </div>
        <h1 className="page-heading" style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 48, lineHeight: 1.1, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          Articles
        </h1>
        <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 18, color: "var(--muted)", lineHeight: 1.55, marginBottom: allTags.length ? 32 : 56 }}>
          Notes on cloud security, detection engineering, and the discipline of building things that hold.
        </p>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
            <Link href="/articles" style={tagPill("all", !activeTag)}>all</Link>
            {allTags.map(tag => (
              <Link key={tag} href={`/articles?tag=${encodeURIComponent(tag)}`} style={tagPill(tag, activeTag === tag)}>
                {tag}
              </Link>
            ))}
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "0" }} />

        {articles.length === 0 ? (
          <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: "var(--muted)", fontSize: 17, marginTop: 48 }}>
            {activeTag ? `No articles tagged "${activeTag}".` : "No articles yet. Check back soon."}
          </p>
        ) : (
          <div>
            {articles.map((article, i) => {
              const tags: string[] = JSON.parse(article.tags || "[]");
              return (
                <div key={article.id}>
                  <Link href={`/articles/${article.slug}`} className="article-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 10 }}>
                      <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 500, lineHeight: 1.2, margin: 0, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                        {article.title}
                      </h2>
                      <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                        {formatDate(new Date(article.createdAt))}
                      </span>
                    </div>
                    {article.excerpt && (
                      <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 16.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 12px", maxWidth: 580 }}>
                        {article.excerpt}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--green)", letterSpacing: "0.05em" }}>
                        {readingTime(article.content || "")} min read →
                      </span>
                      {tags.map(tag => (
                        <span key={tag} style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 10.5, letterSpacing: "0.06em", padding: "2px 8px", border: "1px solid var(--rule)", borderRadius: 2, color: "var(--muted)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                  {i < articles.length - 1 && <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: 0 }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

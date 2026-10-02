export const dynamic = "force-dynamic";

import { getArticleBySlug, getPublishedArticles, getRelatedArticles } from "@/app/lib/articles";
import { markdownToHtml, readingTime } from "@/app/lib/markdown";
import { addSyntaxHighlighting } from "@/app/lib/highlighter";
import ArticleContent from "@/components/ArticleContent";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) return {};
    const desc = article.excerpt || article.content.replace(/<[^>]+>/g, "").slice(0, 160);
    return {
      title: article.title,
      description: desc,
      openGraph: {
        title: article.title,
        description: desc,
        type: "article",
        publishedTime: new Date(article.createdAt).toISOString(),
      },
      twitter: { card: "summary_large_image", title: article.title, description: desc },
    };
  } catch {
    return {};
  }
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || !article.published) notFound();

  const articleTags: string[] = JSON.parse(article.tags || "[]");
  const [html, related] = await Promise.all([
    addSyntaxHighlighting(markdownToHtml(article.content)),
    getRelatedArticles(article.slug, articleTags),
  ]);
  const minutes = readingTime(article.content);

  return (
    <main style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      <div className="page-pad" style={{ maxWidth: 760, margin: "0 auto", padding: "64px 32px 140px" }}>
        <div style={{ marginBottom: 48 }}>
          <Link href="/articles" style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>← articles</Link>
        </div>

        <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11.5, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <span>{formatDate(new Date(article.createdAt))}</span>
          <span>{minutes} min read</span>
          {(JSON.parse(article.tags || "[]") as string[]).map((tag: string) => (
            <Link key={tag} href={`/articles?tag=${encodeURIComponent(tag)}`}
              style={{ fontSize: 10.5, padding: "2px 8px", border: "1px solid var(--rule)", borderRadius: 2, color: "var(--muted)", textDecoration: "none" }}>
              {tag}
            </Link>
          ))}
        </div>

        <h1 className="page-heading" style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 44, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.01em" }}>
          {article.title}
        </h1>

        {article.excerpt && (
          <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 19, color: "var(--muted)", lineHeight: 1.55, marginBottom: 48 }}>
            {article.excerpt}
          </p>
        )}

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "0 0 48px" }} />

        <ArticleContent html={html} />

        {related.length > 0 && (
          <div style={{ marginTop: 80 }}>
            <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "0 0 48px" }} />
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", fontWeight: 500, marginBottom: 28, fontFamily: "var(--font-geist-sans, sans-serif)" }}>
              Related articles
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {related.map((a, i) => (
                <div key={a.id}>
                  <Link href={`/articles/${a.slug}`} style={{ display: "block", padding: "24px 0", textDecoration: "none", color: "inherit" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 500, color: "var(--ink)", lineHeight: 1.25 }}>{a.title}</span>
                      <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(a.createdAt))}
                      </span>
                    </div>
                    {a.excerpt && (
                      <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 15.5, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>{a.excerpt}</p>
                    )}
                  </Link>
                  {i < related.length - 1 && <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

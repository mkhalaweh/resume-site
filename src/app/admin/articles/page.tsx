import { getAllArticles } from "@/app/lib/articles";
import Link from "next/link";
import DeleteArticleButton from "./DeleteArticleButton";

export default async function AdminArticlesPage() {
  const articles = await getAllArticles();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#DDE6EC", margin: 0 }}>Articles</h1>
        <Link href="/admin/articles/new" style={{ background: "#E8A33D", color: "#0B0F14", border: "none", borderRadius: 4, padding: "10px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500, cursor: "pointer", textDecoration: "none" }}>
          New article →
        </Link>
      </div>

      {articles.length === 0 ? (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84" }}>No articles yet.</p>
      ) : (
        <div>
          {articles.map(article => (
            <div key={article.id} style={{ background: "#141e2b", border: "1px solid #20282F", borderRadius: 6, padding: "20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, color: "#DDE6EC", marginBottom: 4 }}>{article.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6E7B84", display: "flex", gap: 16 }}>
                  <span style={{ color: article.published ? "#3FBF5D" : "#E8B93F" }}>{article.published ? "published" : "draft"}</span>
                  <span>/{article.slug}</span>
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Link href={`/admin/articles/${article.id}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6E7B84", textDecoration: "none" }}>edit →</Link>
              <DeleteArticleButton id={article.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

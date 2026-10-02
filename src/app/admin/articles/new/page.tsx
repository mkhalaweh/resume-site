import ArticleEditor from "../ArticleEditor";

export default function NewArticlePage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 32px" }}>
      <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#DDE6EC", margin: "0 0 8px" }}>New Article</h1>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", marginBottom: 48 }}>Write in markdown — preview updates live</p>
      <ArticleEditor />
    </div>
  );
}

import { prisma } from "@/app/lib/db";
import { notFound } from "next/navigation";
import ArticleEditor from "../ArticleEditor";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 32px" }}>
      <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#DDE6EC", margin: "0 0 8px" }}>Edit Article</h1>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", marginBottom: 48 }}>Write in markdown — preview updates live</p>
      <ArticleEditor article={article} />
    </div>
  );
}

import { prisma } from "@/app/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const [articleCount, publishedCount] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { published: true } }),
  ]);
  const resume = await prisma.resume.findFirst({ select: { updatedAt: true, name: true } });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#DDE6EC", margin: "0 0 8px" }}>Dashboard</h1>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", marginBottom: 48 }}>
        {resume?.name} · site admin
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginBottom: 48 }}>
        {[
          { label: "Total articles", value: articleCount },
          { label: "Published", value: publishedCount },
          { label: "Drafts", value: articleCount - publishedCount },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#141e2b", border: "1px solid #20282F", borderRadius: 8, padding: "24px 20px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6E7B84", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 32, fontWeight: 500, color: "#E8A33D" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { href: "/admin/resume", label: "Edit resume" },
          { href: "/admin/articles/new", label: "New article" },
          { href: "/admin/articles", label: "Manage articles" },
        ].map(link => (
          <Link key={link.href} href={link.href}
            style={{ background: "#141e2b", border: "1px solid #20282F", borderRadius: 6, padding: "12px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#DDE6EC", textDecoration: "none" }}>
            {link.label} →
          </Link>
        ))}
      </div>

      {resume?.updatedAt && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#455058", marginTop: 32 }}>
          Resume last updated: {new Date(resume.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

import { getResume } from "@/app/lib/resume";
import { getPublishedArticles } from "@/app/lib/articles";
import Terminal from "@/components/Terminal";
import ContactForm from "@/components/ContactForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mohamad Halaweh — Security Consulting",
  description: "Security consultant at Accenture — cloud security architecture, identity, and detection engineering. Based in Doha, Qatar.",
  openGraph: {
    title: "Mohamad Halaweh — Security Consulting",
    description: "Security consultant at Accenture — cloud security architecture, identity, and detection engineering.",
    type: "website",
  },
};

export default async function Home() {
  const [resume, articles] = await Promise.all([getResume(), getPublishedArticles()]);

  if (!resume) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)" }}>
        <p style={{ color: "var(--muted)", fontFamily: "'Newsreader', serif", fontStyle: "italic" }}>
          No resume data found. Run <code>npx prisma db seed</code>.
        </p>
      </main>
    );
  }

  return (
    <main style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      <div className="page-pad" style={{ maxWidth: 760, margin: "0 auto", padding: "64px 32px 140px" }}>
        <div style={{ fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green)", fontWeight: 500, marginBottom: 22, fontFamily: "var(--font-geist-sans, 'Inter', sans-serif)" }}>
          Security consulting · {resume.location}
        </div>

        <h1 className="page-heading" style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 52, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-0.01em" }}>
          {resume.name}
        </h1>

        <p className="page-subheading" style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 20, color: "var(--muted)", lineHeight: 1.55, maxWidth: 600, marginBottom: 40 }}>
          {resume.about.split("\n\n")[0]}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 28px", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, marginBottom: 56 }}>
          <Link href="/articles" className="site-link">Articles →</Link>
          {resume.linkedin && <a href={resume.linkedin} target="_blank" rel="noopener" className="site-link">LinkedIn</a>}
          {resume.github && <a href={resume.github} target="_blank" rel="noopener" className="site-link">GitHub</a>}
        </div>

        <div style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "var(--muted)", marginBottom: 80, padding: "14px 18px", border: "1px solid var(--rule)", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--accent)" }}>&gt;_</span>
          <span>explore my résumé and articles via the terminal — open it below</span>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "0 0 44px" }} />

        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--green)", margin: "0 0 12px" }}>
          Get in touch
        </h2>
        <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 17, color: "var(--muted)", lineHeight: 1.55, maxWidth: 520, marginBottom: 36 }}>
          Open to advisory conversations, architecture reviews, and the right consulting opportunities.
        </p>
        <ContactForm />
      </div>

      <Terminal resume={resume} articles={articles} />
    </main>
  );
}

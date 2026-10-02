import { getResume } from "@/app/lib/resume";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ResumePage() {
  const resume = await getResume();
  if (!resume) notFound();

  return (
    <main style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "90px 32px 140px" }}>
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>← back</Link>
        </div>

        <div style={{ fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green)", fontWeight: 500, marginBottom: 22, fontFamily: "var(--font-geist-sans, sans-serif)" }}>
          {resume.title} · {resume.location}
        </div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 52, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-0.01em" }}>
          {resume.name}
        </h1>
        <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 18, color: "var(--muted)", lineHeight: 1.6, maxWidth: 600, marginBottom: 16 }}>
          {resume.about.split("\n\n")[0]}
        </p>
        {resume.about.split("\n\n").length > 1 && (
          <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 18, color: "var(--muted)", lineHeight: 1.6, maxWidth: 600, marginBottom: 40 }}>
            {resume.about.split("\n\n")[1]}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 28px", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 13, marginBottom: 8 }}>
          {resume.linkedin && <a href={resume.linkedin} target="_blank" rel="noopener" style={{ color: "var(--green)", textDecoration: "none" }}>LinkedIn</a>}
          {resume.github && <a href={resume.github} target="_blank" rel="noopener" style={{ color: "var(--green)", textDecoration: "none" }}>GitHub</a>}
          <a href="/resume.pdf" download="Mohamad_Halaweh_Resume.pdf" style={{ color: "var(--green)", textDecoration: "none" }}>Download PDF</a>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "44px 0" }} />

        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--green)", margin: "0 0 22px" }}>Experience</h2>
        {resume.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 17, fontWeight: 500 }}>{exp.role}</span>
              <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>{exp.period}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: "var(--muted)", fontSize: 15 }}>{exp.org}</span>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>· {exp.location}</span>
            </div>
            <ul style={{ margin: "10px 0 0 0", paddingLeft: 20 }}>
              {exp.bullets.map((b, j) => (
                <li key={j} style={{ fontSize: 15, lineHeight: 1.65, color: "#333c46", marginBottom: 4, maxWidth: 640 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "44px 0" }} />

        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--green)", margin: "0 0 22px" }}>Skills</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 24, marginBottom: 8 }}>
          {resume.skills.map((sg, i) => (
            <div key={i}>
              <div style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", fontWeight: 500, marginBottom: 8, fontFamily: "var(--font-geist-sans, sans-serif)" }}>{sg.category}</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {sg.items.map((item, j) => (
                  <li key={j} style={{ fontSize: 14, color: "#333c46", lineHeight: 1.8 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--rule)", margin: "44px 0" }} />

        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--green)", margin: "0 0 22px" }}>Credentials</h2>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginTop: 8, marginBottom: 36 }}>
          {resume.certs.map((cert, i) => (
            <span key={i} style={{ fontSize: 12.5, border: "1px solid var(--rule)", borderRadius: 2, padding: "6px 10px", color: "var(--muted)" }}>
              {cert.code} · {cert.name}
            </span>
          ))}
        </div>

        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--green)", margin: "0 0 22px" }}>Education</h2>
        {resume.education.map((edu, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{edu.degree}</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", color: "var(--muted)", fontSize: 15 }}>{edu.school}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

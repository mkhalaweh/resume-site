"use client";

import { useState, useEffect, useRef } from "react";

type SkillGroup = { category: string; items: string[] };
type ExperienceItem = { role: string; org: string; location: string; period: string; bullets: string[] };
type Cert = { code: string; name: string; issuer: string };
type Education = { degree: string; school: string };

type ResumeData = {
  name: string; title: string; location: string; about: string;
  email: string; phone: string; linkedin: string; github: string;
  skills: SkillGroup[]; experience: ExperienceItem[];
  certs: Cert[]; education: Education[];
};

const emptyResume: ResumeData = {
  name: "", title: "", location: "", about: "",
  email: "", phone: "", linkedin: "", github: "",
  skills: [], experience: [], certs: [], education: [],
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#141e2b", border: "1px solid #20282F", borderRadius: 4,
  color: "#DDE6EC", fontFamily: "inherit", fontSize: 13, padding: "10px 12px",
  outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
  color: "#6E7B84", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase",
};
const sectionTitle: React.CSSProperties = {
  fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 500, color: "#DDE6EC",
  margin: "0 0 20px", borderBottom: "1px solid #20282F", paddingBottom: 12,
};
const cardStyle: React.CSSProperties = {
  background: "#141e2b", border: "1px solid #20282F", borderRadius: 6,
  padding: "20px", marginBottom: 12,
};
const btnPrimary: React.CSSProperties = {
  background: "#E8A33D", color: "#0B0F14", border: "none", borderRadius: 4,
  padding: "10px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
  fontWeight: 500, cursor: "pointer", letterSpacing: "0.05em",
};
const btnSecondary: React.CSSProperties = {
  background: "none", color: "#6E7B84", border: "1px solid #20282F", borderRadius: 4,
  padding: "8px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
  cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  background: "none", color: "#D98872", border: "1px solid #D98872", borderRadius: 4,
  padding: "6px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
  cursor: "pointer",
};

export default function AdminResumePage() {
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMsg, setPdfMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/resume")
      .then(r => r.json())
      .then(d => {
        if (d) setData({ ...emptyResume, ...d, email: d.email || "", phone: d.phone || "", linkedin: d.linkedin || "", github: d.github || "" });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/resume", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setMsg(res.ok ? "Saved successfully." : "Error saving.");
  };

  const uploadPdf = async (file: File) => {
    setPdfUploading(true); setPdfMsg("");
    const fd = new FormData();
    fd.append("pdf", file);
    const res = await fetch("/api/resume/pdf", { method: "POST", body: fd });
    setPdfUploading(false);
    setPdfMsg(res.ok ? "PDF uploaded — terminal will reflect it immediately." : "Upload failed.");
  };

  const set = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) =>
    setData(d => ({ ...d, [key]: val }));

  const addSkillGroup = () => set("skills", [...data.skills, { category: "", items: [] }]);
  const removeSkillGroup = (i: number) => set("skills", data.skills.filter((_, j) => j !== i));
  const updateSkillGroup = (i: number, key: "category" | "items", val: string | string[]) => {
    const next = [...data.skills];
    next[i] = { ...next[i], [key]: val };
    set("skills", next);
  };

  const addExp = () => set("experience", [...data.experience, { role: "", org: "", location: "", period: "", bullets: [""] }]);
  const removeExp = (i: number) => set("experience", data.experience.filter((_, j) => j !== i));
  const updateExp = (i: number, key: keyof ExperienceItem, val: string | string[]) => {
    const next = [...data.experience];
    next[i] = { ...next[i], [key]: val };
    set("experience", next);
  };

  const addCert = () => set("certs", [...data.certs, { code: "", name: "", issuer: "" }]);
  const removeCert = (i: number) => set("certs", data.certs.filter((_, j) => j !== i));
  const updateCert = (i: number, key: keyof Cert, val: string) => {
    const next = [...data.certs];
    next[i] = { ...next[i], [key]: val };
    set("certs", next);
  };

  const addEdu = () => set("education", [...data.education, { degree: "", school: "" }]);
  const removeEdu = (i: number) => set("education", data.education.filter((_, j) => j !== i));
  const updateEdu = (i: number, key: keyof Education, val: string) => {
    const next = [...data.education];
    next[i] = { ...next[i], [key]: val };
    set("education", next);
  };

  if (loading) return <div style={{ padding: 60, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84" }}>loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
        <div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#DDE6EC", margin: "0 0 8px" }}>Edit Resume</h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84" }}>Changes save to DB and reflect on the public site and terminal</p>
        </div>
        <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "Saving..." : "Save all changes"}</button>
      </div>
      {msg && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: msg.includes("Error") ? "#D98872" : "#3FBF5D", marginBottom: 24 }}>{msg}</div>}

      {/* PDF Upload */}
      <div style={{ ...cardStyle, marginBottom: 40, borderColor: "#E8A33D33" }}>
        <h2 style={{ ...sectionTitle, borderColor: "#E8A33D33" }}>Resume PDF</h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", marginBottom: 16 }}>
          Upload your resume PDF — served at /resume.pdf and available in the terminal via{" "}
          <code style={{ color: "#E8A33D" }}>open resume.pdf</code> or <code style={{ color: "#E8A33D" }}>cat resume.pdf</code>.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f); }} />
          <button onClick={() => fileInputRef.current?.click()} style={btnPrimary} disabled={pdfUploading}>
            {pdfUploading ? "Uploading..." : "Upload PDF"}
          </button>
          <a href="/resume.pdf" target="_blank" rel="noopener" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6E7B84", textDecoration: "none" }}>
            view current →
          </a>
        </div>
        {pdfMsg && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: pdfMsg.includes("failed") ? "#D98872" : "#3FBF5D", marginTop: 10 }}>{pdfMsg}</p>}
      </div>

      {/* Basic info */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionTitle}>Basic info</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {(["name", "title", "location"] as const).map(field => (
            <div key={field}>
              <label style={labelStyle}>{field}</label>
              <input value={data[field]} onChange={e => set(field, e.target.value)} style={inputStyle} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>About</label>
          <textarea value={data.about} onChange={e => set("about", e.target.value)} rows={5}
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={data.email} onChange={e => set("email", e.target.value)} style={inputStyle} placeholder="you@example.com" />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input value={data.phone} onChange={e => set("phone", e.target.value)} style={inputStyle} placeholder="+974 ..." />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>LinkedIn URL</label>
            <input value={data.linkedin} onChange={e => set("linkedin", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>GitHub URL</label>
            <input value={data.github} onChange={e => set("github", e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionTitle}>Skills</h2>
        {data.skills.map((sg, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Category</label>
                <input value={sg.category} onChange={e => updateSkillGroup(i, "category", e.target.value)} style={inputStyle} />
              </div>
              <button onClick={() => removeSkillGroup(i)} style={{ ...btnDanger, marginTop: 26 }}>remove</button>
            </div>
            <div>
              <label style={labelStyle}>Items (one per line)</label>
              <textarea value={sg.items.join("\n")} rows={4}
                onChange={e => updateSkillGroup(i, "items", e.target.value.split("\n").filter(Boolean))}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
        ))}
        <button onClick={addSkillGroup} style={btnSecondary}>+ Add skill group</button>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionTitle}>Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 16, color: "#DDE6EC" }}>{exp.role || `Experience ${i + 1}`}</span>
              <button onClick={() => removeExp(i)} style={btnDanger}>remove</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {(["role", "org", "location", "period"] as const).map(field => (
                <div key={field}>
                  <label style={labelStyle}>{field}</label>
                  <input value={exp[field]} onChange={e => updateExp(i, field, e.target.value)} style={inputStyle} />
                </div>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Bullets (one per line)</label>
              <textarea value={exp.bullets.join("\n")} rows={5}
                onChange={e => updateExp(i, "bullets", e.target.value.split("\n").filter(Boolean))}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
        ))}
        <button onClick={addExp} style={btnSecondary}>+ Add experience</button>
      </div>

      {/* Certifications */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionTitle}>Certifications</h2>
        {data.certs.map((c, i) => (
          <div key={i} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 2fr 2fr auto", gap: 12, alignItems: "end" }}>
            {(["code", "name", "issuer"] as const).map(field => (
              <div key={field}>
                <label style={labelStyle}>{field}</label>
                <input value={c[field]} onChange={e => updateCert(i, field, e.target.value)} style={inputStyle} />
              </div>
            ))}
            <button onClick={() => removeCert(i)} style={{ ...btnDanger, alignSelf: "flex-end" }}>×</button>
          </div>
        ))}
        <button onClick={addCert} style={btnSecondary}>+ Add certification</button>
      </div>

      {/* Education */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={sectionTitle}>Education</h2>
        {data.education.map((e, i) => (
          <div key={i} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            {(["degree", "school"] as const).map(field => (
              <div key={field}>
                <label style={labelStyle}>{field}</label>
                <input value={e[field]} onChange={e2 => updateEdu(i, field, e2.target.value)} style={inputStyle} />
              </div>
            ))}
            <button onClick={() => removeEdu(i)} style={{ ...btnDanger, alignSelf: "flex-end" }}>×</button>
          </div>
        ))}
        <button onClick={addEdu} style={btnSecondary}>+ Add education</button>
      </div>

      <button onClick={save} disabled={saving} style={{ ...btnPrimary, width: "100%", padding: "14px" }}>
        {saving ? "Saving..." : "Save all changes"}
      </button>
      {msg && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: msg.includes("Error") ? "#D98872" : "#3FBF5D", marginTop: 16 }}>{msg}</div>}
    </div>
  );
}

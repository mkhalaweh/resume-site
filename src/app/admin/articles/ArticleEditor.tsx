"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { markdownToHtml } from "@/app/lib/markdown";

type ArticleData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  tags?: string;
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

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function ArticleEditor({ article }: { article?: ArticleData & { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [published, setPublished] = useState(article?.published || false);
  const [tags, setTags] = useState<string[]>(() => {
    try { return JSON.parse(article?.tags || "[]"); } catch { return []; }
  });
  const [tagInput, setTagInput] = useState("");
  const [previewMode, setPreviewMode] = useState<"write" | "preview" | "split">("split");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!article) setSlug(slugify(val));
  };

  const save = async (pub?: boolean) => {
    setSaving(true); setMsg("");
    if (!title.trim()) { setMsg("Title is required."); setSaving(false); return; }
    if (!slug.trim()) { setMsg("Slug is required."); setSaving(false); return; }
    const isPublished = pub !== undefined ? pub : published;
    const body = { title: title.trim(), slug: slug.trim(), excerpt, content, published: isPublished };
    const url = article ? `/api/articles/${article.id}` : "/api/articles";
    const method = article ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, tags }),
      });
      const data = await res.json();
      setSaving(false);
      if (res.ok) {
        setMsg(isPublished ? "Published!" : "Saved as draft.");
        setPublished(isPublished);
        if (!article) router.push(`/admin/articles/${data.id}`);
      } else {
        setMsg(data?.error || `Error ${res.status} — check the slug isn't already taken.`);
      }
    } catch {
      setSaving(false);
      setMsg("Network error — check your connection.");
    }
  };

  const previewHtml = useCallback(() => markdownToHtml(content), [content]);

  const uploadImage = async (file: File) => {
    setImgUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    setImgUploading(false);
    if (!res.ok) { setMsg("Image upload failed."); return; }
    const { url } = await res.json();
    const alt = file.name.replace(/\.[^.]+$/, "");
    insertMarkdown(`\n![${alt}](${url})\n`);
  };

  const insertMarkdown = (before: string, after: string = "") => {
    const ta = document.getElementById("article-content") as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, end + before.length); }, 0);
  };

  return (
    <div>
      <input
        ref={imgInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input value={title} onChange={e => handleTitleChange(e.target.value)} style={inputStyle} placeholder="Article title..." />
        </div>
        <div>
          <label style={labelStyle}>Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} placeholder="url-slug" />
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Excerpt</label>
        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "'Newsreader', serif", fontStyle: "italic" }}
          placeholder="Short italic description shown in listings..." />
      </div>

      {/* Tags */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Tags</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {tags.map(tag => (
            <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a2d1f", border: "1px solid #2F4A3E", borderRadius: 3, padding: "4px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9AABB5" }}>
              {tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))}
                style={{ background: "none", border: "none", color: "#6E7B84", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 13 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                e.preventDefault();
                const t = tagInput.trim().toLowerCase().replace(/,/g, "");
                if (t && !tags.includes(t)) setTags([...tags, t]);
                setTagInput("");
              }
            }}
            placeholder="Type a tag, press Enter or comma"
            style={{ ...inputStyle, width: "auto", flex: 1, fontFamily: "'JetBrains Mono', monospace" }}
          />
          <button onClick={() => {
            const t = tagInput.trim().toLowerCase().replace(/,/g, "");
            if (t && !tags.includes(t)) setTags([...tags, t]);
            setTagInput("");
          }} style={{ background: "#141e2b", border: "1px solid #20282F", borderRadius: 4, color: "#9AABB5", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "6px 12px", cursor: "pointer" }}>
            add
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { label: "B", action: () => insertMarkdown("**", "**"), title: "Bold" },
            { label: "I", action: () => insertMarkdown("*", "*"), title: "Italic" },
            { label: "H1", action: () => insertMarkdown("# "), title: "Heading 1" },
            { label: "H2", action: () => insertMarkdown("## "), title: "Heading 2" },
            { label: "—", action: () => insertMarkdown("---\n"), title: "Divider" },
            { label: "•", action: () => insertMarkdown("- "), title: "List item" },
            { label: "`c`", action: () => insertMarkdown("`", "`"), title: "Inline code" },
            { label: "```", action: () => insertMarkdown("```\n", "\n```"), title: "Code block" },
            { label: ">", action: () => insertMarkdown("> "), title: "Blockquote" },
          ].map(b => (
            <button key={b.label} onClick={b.action} title={b.title}
              style={{ background: "#141e2b", border: "1px solid #20282F", borderRadius: 3, color: "#9AABB5", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 9px", cursor: "pointer" }}>
              {b.label}
            </button>
          ))}
          <button
            onClick={() => imgInputRef.current?.click()}
            disabled={imgUploading}
            title="Upload image"
            style={{ background: "#141e2b", border: "1px solid #20282F", borderRadius: 3, color: imgUploading ? "#455058" : "#E8A33D", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 9px", cursor: "pointer" }}
          >
            {imgUploading ? "↑..." : "img"}
          </button>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {(["write", "split", "preview"] as const).map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)}
              style={{ background: previewMode === mode ? "#E8A33D" : "#141e2b", color: previewMode === mode ? "#0B0F14" : "#6E7B84", border: "1px solid #20282F", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div style={{ display: "grid", gridTemplateColumns: previewMode === "split" ? "1fr 1fr" : "1fr", gap: 0, marginBottom: 24 }}>
        {previewMode !== "preview" && (
          <textarea
            id="article-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={24}
            placeholder="Write in markdown..."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7, borderRadius: previewMode === "split" ? "4px 0 0 4px" : "4px" }}
          />
        )}
        {previewMode !== "write" && (
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: previewHtml() || "<p style='color:#6E7B84;font-style:italic'>Preview will appear here...</p>" }}
            style={{ background: "#F3F1EA", padding: "16px 20px", borderRadius: previewMode === "split" ? "0 4px 4px 0" : "4px", minHeight: 400, overflowY: "auto", border: "1px solid #20282F", borderLeft: previewMode === "split" ? "none" : "1px solid #20282F" }}
          />
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => save(false)} disabled={saving}
          style={{ background: "none", color: "#DDE6EC", border: "1px solid #20282F", borderRadius: 4, padding: "10px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, cursor: "pointer" }}>
          {saving ? "Saving..." : "Save draft"}
        </button>
        <button onClick={() => save(true)} disabled={saving}
          style={{ background: "#E8A33D", color: "#0B0F14", border: "none", borderRadius: 4, padding: "10px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          {saving ? "..." : (published ? "Update published" : "Publish")}
        </button>
        {article && published && (
          <a href={`/articles/${article.slug}`} target="_blank" rel="noopener"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6E7B84", textDecoration: "none" }}>
            view live →
          </a>
        )}
        {msg && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: msg.includes("Error") ? "#D98872" : "#3FBF5D" }}>{msg}</span>}
      </div>
    </div>
  );
}

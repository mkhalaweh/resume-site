"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--rule)",
  color: "var(--ink)",
  fontFamily: "'Newsreader', serif",
  fontSize: 17,
  padding: "10px 0",
  outline: "none",
  boxSizing: "border-box",
  borderRadius: 0,
};

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [website, setWebsite] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("sent");
        setName(""); setEmail(""); setMessage("");
      } else {
        setStatus("error");
        setErrorMsg(data?.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again.");
    }
  };

  if (status === "sent") {
    return (
      <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 18, color: "var(--green)", margin: 0 }}>
        Message received — I'll be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginBottom: 8 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Your name"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ marginBottom: 32 }}>
        <label style={{ display: "block", fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Message
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="What's on your mind?"
          style={{ ...inputStyle, resize: "vertical", borderBottom: "1px solid var(--rule)" }}
        />
      </div>
      {status === "error" && (
        <p style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 12, color: "#c0392b", marginBottom: 16 }}>
          {errorMsg}
        </p>
      )}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        style={{
          background: "none",
          border: "1px solid var(--green)",
          color: "var(--green)",
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: 13,
          padding: "10px 24px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          borderRadius: 2,
        }}
      >
        {status === "sending" ? "Sending..." : "Send message →"}
      </button>
    </form>
  );
}

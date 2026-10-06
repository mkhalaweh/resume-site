"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
  };

  return (
    <main style={{ background: "#0e1620", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", marginBottom: 32, letterSpacing: "0.1em" }}>
          mkhalaweh10@admin — bash
        </div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 32, fontWeight: 500, color: "#DDE6EC", margin: "0 0 32px" }}>
          Admin login
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", marginBottom: 6, letterSpacing: "0.05em" }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              style={{ width: "100%", background: "#141e2b", border: "1px solid #20282F", borderRadius: 4, color: "#DDE6EC", fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: "10px 12px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", marginBottom: 6, letterSpacing: "0.05em" }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
              style={{ width: "100%", background: "#141e2b", border: "1px solid #20282F", borderRadius: 4, color: "#DDE6EC", fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: "10px 12px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {error && <div style={{ color: "#D98872", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: "#E8A33D", color: "#0B0F14", border: "none", borderRadius: 4, padding: "12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, cursor: "pointer", letterSpacing: "0.05em" }}>
            {loading ? "..." : "Sign in →"}
          </button>
        </form>
      </div>
    </main>
  );
}

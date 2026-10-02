"use client";

import { useEffect, useState } from "react";

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/contact");
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string, read: boolean) => {
    await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read } : m));
  };

  const unread = messages.filter(m => !m.read).length;

  if (loading) return (
    <div style={{ padding: 60, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84" }}>
      loading...
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 32px" }}>
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 36, fontWeight: 500, color: "#DDE6EC", margin: "0 0 8px" }}>
          Messages
        </h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84" }}>
          {unread > 0 ? `${unread} unread` : "All read"} · {messages.length} total
        </p>
      </div>

      {messages.length === 0 ? (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84" }}>No messages yet.</p>
      ) : (
        <div>
          {messages.map(msg => (
            <div key={msg.id} style={{ background: "#141e2b", border: `1px solid ${msg.read ? "#20282F" : "#E8A33D44"}`, borderRadius: 6, padding: "20px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    {!msg.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8A33D", display: "inline-block", flexShrink: 0 }} />}
                    <span style={{ fontFamily: "'Newsreader', serif", fontSize: 17, color: "#DDE6EC" }}>{msg.name}</span>
                    <a href={`mailto:${msg.email}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6E7B84", textDecoration: "none" }}>
                      {msg.email}
                    </a>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#455058" }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                    style={{ background: "none", color: "#6E7B84", border: "1px solid #20282F", borderRadius: 4, padding: "6px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: "pointer" }}>
                    {expanded === msg.id ? "collapse" : "read"}
                  </button>
                  <button onClick={() => markRead(msg.id, !msg.read)}
                    style={{ background: "none", color: msg.read ? "#455058" : "#3FBF5D", border: `1px solid ${msg.read ? "#20282F" : "#3FBF5D"}`, borderRadius: 4, padding: "6px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: "pointer" }}>
                    {msg.read ? "mark unread" : "mark read"}
                  </button>
                </div>
              </div>
              {expanded === msg.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #20282F", fontFamily: "'Newsreader', serif", fontSize: 16, color: "#9AABB5", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {msg.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

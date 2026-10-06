"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/admin", label: "dashboard" },
  { href: "/admin/resume", label: "resume" },
  { href: "/admin/articles", label: "articles" },
  { href: "/admin/messages", label: "messages" },
];

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

export default function AdminNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const linkStyle = (href: string): React.CSSProperties => ({
    ...mono,
    fontSize: 12,
    color: path === href || (href !== "/admin" && path.startsWith(href)) ? "#E8A33D" : "#6E7B84",
    textDecoration: "none",
  });

  return (
    <nav style={{ borderBottom: "1px solid #20282F", padding: "0 20px", background: "#0e1620", position: "sticky", top: 0, zIndex: 100 }}>
      {/* Desktop row */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, height: 52 }}>
        <span style={{ ...mono, fontSize: 13, color: "#E8A33D", flexShrink: 0 }}>mkhalaweh10@admin</span>

        {/* Desktop links — hidden on mobile */}
        <div className="admin-nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} style={linkStyle(l.href)}>{l.label}</Link>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 20, alignItems: "center" }}>
          <Link href="/" style={{ ...mono, fontSize: 12, color: "#6E7B84", textDecoration: "none" }} className="admin-nav-view">
            view site →
          </Link>
          <div className="admin-nav-logout"><LogoutButton /></div>
          {/* Hamburger — mobile only */}
          <button
            className="admin-nav-burger"
            onClick={() => setOpen(o => !o)}
            style={{ display: "none", background: "none", border: "none", color: "#6E7B84", cursor: "pointer", padding: 4, lineHeight: 1 }}
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="admin-nav-drawer" style={{ borderTop: "1px solid #20282F", padding: "12px 0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{ ...linkStyle(l.href), fontSize: 14, padding: "4px 0" }} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid #20282F", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/" style={{ ...mono, fontSize: 12, color: "#6E7B84", textDecoration: "none" }}>view site →</Link>
            <LogoutButton />
          </div>
        </div>
      )}
    </nav>
  );
}

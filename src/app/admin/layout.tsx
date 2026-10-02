import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#0e1620", minHeight: "100vh", color: "#DDE6EC" }}>
      <nav style={{ borderBottom: "1px solid #20282F", padding: "16px 32px", display: "flex", alignItems: "center", gap: 32 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#E8A33D" }}>mkhalaweh10@admin</span>
        <Link href="/admin" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", textDecoration: "none" }}>dashboard</Link>
        <Link href="/admin/resume" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", textDecoration: "none" }}>resume</Link>
        <Link href="/admin/articles" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", textDecoration: "none" }}>articles</Link>
        <Link href="/admin/messages" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", textDecoration: "none" }}>messages</Link>
        <div style={{ marginLeft: "auto", display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", textDecoration: "none" }}>view site →</Link>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}

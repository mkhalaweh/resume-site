"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavBar() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (path.startsWith("/admin")) return null;

  const onArticles = path.startsWith("/articles");

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "var(--paper)",
      borderBottom: `1px solid ${scrolled ? "var(--rule)" : "transparent"}`,
      transition: "border-color 0.2s ease",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 32px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 500, color: "var(--ink)", textDecoration: "none", letterSpacing: "-0.01em" }}>
          Mohamad Halaweh
        </Link>
        <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/articles" className="nav-link" style={{ color: onArticles ? "var(--accent)" : undefined }}>
            articles
          </Link>
        </nav>
      </div>
    </header>
  );
}

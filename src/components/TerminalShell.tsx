"use client";

import { usePathname } from "next/navigation";
import Terminal from "./Terminal";
import type { ResumeForTerminal, ArticleForTerminal } from "./Terminal";

export default function TerminalShell({ resume, articles }: { resume: ResumeForTerminal; articles: ArticleForTerminal[] }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return <Terminal resume={resume} articles={articles} />;
}

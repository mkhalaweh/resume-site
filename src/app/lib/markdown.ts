export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  let inOL = false;
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="inline-code">$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:4px;margin:1rem 0;" />')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="article-link" target="_blank" rel="noopener">$1</a>');

  const flushList = () => {
    if (inList) { out.push("</ul>"); inList = false; }
    if (inOL) { out.push("</ol>"); inOL = false; }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(`<pre data-lang="${codeLang}"><code>${codeLines.map(esc).join("\n")}</code></pre>`);
        codeLines = []; codeLang = ""; inCode = false;
      } else {
        flushList();
        codeLang = line.slice(3).trim();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.startsWith("### ")) {
      flushList(); out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushList(); out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      flushList(); out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith("> ")) {
      flushList(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    } else if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      flushList(); out.push("<hr>");
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (inOL) { out.push("</ol>"); inOL = false; }
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (/^\d+\. /.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      if (!inOL) { out.push("<ol>"); inOL = true; }
      out.push(`<li>${inline(line.replace(/^\d+\. /, ""))}</li>`);
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  if (inCode) out.push(`<pre data-lang="${codeLang}"><code>${codeLines.map(esc).join("\n")}</code></pre>`);
  return out.join("\n");
}

export function readingTime(content: string): number {
  return Math.max(1, Math.round(content.split(/\s+/).length / 200));
}

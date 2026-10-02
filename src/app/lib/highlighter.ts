import { codeToHtml } from "shiki";

const FALLBACK_LANGS = new Set(["text", "plain", "txt", ""]);

export async function addSyntaxHighlighting(html: string): Promise<string> {
  const regex = /<pre data-lang="([^"]*?)"><code>([\s\S]*?)<\/code><\/pre>/g;
  const matches = [...html.matchAll(regex)];
  if (matches.length === 0) return html;

  const replacements = await Promise.all(
    matches.map(async ([full, lang, escapedCode]) => {
      const code = escapedCode
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");

      const resolvedLang = FALLBACK_LANGS.has(lang) ? "text" : lang;
      try {
        const highlighted = await codeToHtml(code, {
          lang: resolvedLang,
          theme: "github-dark",
        });
        return { full, highlighted };
      } catch {
        const fallback = await codeToHtml(code, { lang: "text", theme: "github-dark" });
        return { full, highlighted: fallback };
      }
    })
  );

  let result = html;
  for (const { full, highlighted } of replacements) {
    result = result.replace(full, highlighted);
  }
  return result;
}

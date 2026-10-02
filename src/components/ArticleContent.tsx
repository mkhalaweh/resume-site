"use client";

import { useEffect, useRef } from "react";

export default function ArticleContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll("pre").forEach(pre => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "copy";
      btn.onclick = async () => {
        const text = pre.querySelector("code")?.innerText ?? pre.innerText;
        await navigator.clipboard.writeText(text);
        btn.textContent = "copied!";
        setTimeout(() => { btn.textContent = "copy"; }, 2000);
      };
      pre.style.position = "relative";
      pre.appendChild(btn);
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="article-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

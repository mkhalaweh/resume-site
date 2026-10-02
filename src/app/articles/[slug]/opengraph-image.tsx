import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/app/lib/articles";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const title = article?.title ?? "Article";
  const excerpt = article?.excerpt ?? "";

  return new ImageResponse(
    <div
      style={{
        background: "#F3F1EA",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "80px 80px 80px 88px",
        borderLeft: "8px solid #2F4A3E",
      }}
    >
      <div style={{ color: "#2F4A3E", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 28, display: "flex" }}>
        Mohamad Halaweh · Security Consulting
      </div>
      <div style={{ color: "#1B2430", fontSize: title.length > 50 ? 48 : 60, fontWeight: 600, lineHeight: 1.1, marginBottom: 24, maxWidth: 980, display: "flex" }}>
        {title}
      </div>
      {excerpt ? (
        <div style={{ color: "#5B6472", fontSize: 22, fontStyle: "italic", maxWidth: 860, display: "flex" }}>
          {excerpt.slice(0, 140)}
        </div>
      ) : null}
    </div>,
    { ...size }
  );
}

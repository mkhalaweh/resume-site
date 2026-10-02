import { ImageResponse } from "next/og";

export const alt = "Mohamad Halaweh — Security Consulting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
      <div style={{ color: "#2F4A3E", fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 24, display: "flex" }}>
        Security Consulting · Doha, Qatar
      </div>
      <div style={{ color: "#1B2430", fontSize: 72, fontWeight: 600, lineHeight: 1.05, marginBottom: 24, display: "flex" }}>
        Mohamad Halaweh
      </div>
      <div style={{ color: "#5B6472", fontSize: 26, display: "flex" }}>
        Cloud Security · Identity · Detection Engineering
      </div>
    </div>,
    { ...size }
  );
}

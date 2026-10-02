import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        width: 32, height: 32,
        background: "#F3F1EA",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{
          color: "#2F4A3E",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "monospace",
          letterSpacing: "-1px",
          marginTop: 1,
        }}>
          &gt;_
        </span>
      </div>
    ),
    { ...size }
  );
}

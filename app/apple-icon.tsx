import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5B7FFF 0%, #FF8A5B 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 92,
            height: 92,
            borderRadius: 22,
            background: "rgba(255,255,255,0.95)",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 54,
            fontWeight: 700,
            color: "#1C1C1E",
            fontFamily: "sans-serif",
          }}
        >
          D
        </div>
      </div>
    ),
    { ...size }
  );
}

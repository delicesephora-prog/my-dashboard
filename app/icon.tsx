import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 260,
            height: 260,
            borderRadius: 64,
            background: "rgba(255,255,255,0.95)",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 150,
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

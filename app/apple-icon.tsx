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
          background: "linear-gradient(135deg, #EFE7DA 0%, #F6E6DA 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 92,
            height: 92,
            borderRadius: 20,
            background: "#6E5C4B",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 54,
            fontWeight: 500,
            color: "#FBF5EA",
            fontFamily: "Georgia, serif",
          }}
        >
          D
        </div>
      </div>
    ),
    { ...size }
  );
}

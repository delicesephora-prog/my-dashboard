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
          background: "linear-gradient(135deg, #EFE7DA 0%, #F6E6DA 100%)",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 260,
            height: 260,
            borderRadius: 56,
            background: "#6E5C4B",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 150,
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

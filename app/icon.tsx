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
          background: "linear-gradient(135deg, #EEE0E3 0%, #E4D3B4 100%)",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 260,
            height: 260,
            borderRadius: 56,
            background: "#5B2333",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 150,
            fontWeight: 500,
            color: "#FFFDF8",
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

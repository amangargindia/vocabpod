import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "VocabPod - Master Advanced English Words";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d0d", // absolute-black
          backgroundImage: "linear-gradient(to bottom right, #0d0d0d, #1a1a1a, #E04B3540)", // subtile terracotta glow
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              backgroundColor: "#2a0f0a", // dark-blush
              border: "4px solid #E04B35", // terracotta
              marginBottom: "40px",
              color: "#E04B35",
              fontSize: "72px",
              fontWeight: "900",
            }}
          >
            V
          </div>
          <h1
            style={{
              fontSize: "84px",
              fontWeight: "900",
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              marginBottom: "20px",
              lineHeight: 1.1,
            }}
          >
            VocabPod
          </h1>
          <p
            style={{
              fontSize: "36px",
              fontWeight: "600",
              color: "#A0A0A0", // muted-ash
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            Master 150 Advanced English Words in 30 Days using Spaced Repetition & Visual Mnemonics
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

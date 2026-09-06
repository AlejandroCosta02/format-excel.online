import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FormatExcel.online — Excel formatter, manifest extractor, and mail merge";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#090D16",
          color: "#F8FAFC",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Fx
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>FormatExcel.online</div>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          Format Excel, extract manifests, and run mail merge in the browser.
        </div>
        <div style={{ marginTop: 28, fontSize: 26, color: "#94A3B8" }}>
          Guest-friendly · Private · Try it free
        </div>
      </div>
    ),
    { ...size },
  );
}

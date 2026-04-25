import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BuildBase — Structured Fitness Coaching";

async function fetchSpaceGroteskBold(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap",
      {
        headers: {
          // Google Fonts returns woff2 for modern browsers
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    ).then((r) => r.text());

    const match = css.match(/url\(([^)]+\.woff2[^)]*)\)/);
    if (!match?.[1]) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const fontData = await fetchSpaceGroteskBold();
  const font = fontData ? "Space Grotesk" : "system-ui, sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "#EDE4D3",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Orange accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: "#C84B1A",
            display: "flex",
          }}
        />

        {/* Ghost "BB" watermark — fills bottom-right */}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -100,
            display: "flex",
            fontSize: 480,
            fontWeight: 700,
            lineHeight: 1,
            color: "rgba(255,255,255,0.025)",
            fontFamily: font,
            letterSpacing: "-0.02em",
          }}
        >
          BB
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "72px 88px 36px",
          }}
        >
          {/* Platform label */}
          <div
            style={{
              display: "flex",
              fontSize: 13,
              fontWeight: 600,
              color: "#988A78",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontFamily: font,
              marginBottom: 32,
            }}
          >
            FITNESS COACHING PLATFORM
          </div>

          {/* WordMark */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginBottom: 40,
              lineHeight: 1,
            }}
          >
            <div
              style={{
                fontSize: 104,
                fontWeight: 700,
                color: "#2C1A10",
                fontFamily: font,
                lineHeight: 1,
                display: "flex",
              }}
            >
              Build
            </div>
            <div
              style={{
                fontSize: 104,
                fontWeight: 700,
                color: "#C84B1A",
                fontFamily: font,
                lineHeight: 1,
                display: "flex",
              }}
            >
              Base
            </div>
          </div>

          {/* Accent rule */}
          <div
            style={{
              width: 56,
              height: 3,
              background: "rgba(200,75,26,0.45)",
              borderRadius: 2,
              marginBottom: 36,
              display: "flex",
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 34,
              color: "#6B5A48",
              fontFamily: font,
              lineHeight: 1.5,
              maxWidth: 580,
              display: "flex",
            }}
          >
            Working to get better, one session at a time.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 88px",
            borderTop: "1px solid #C8B99D",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#988A78",
              fontFamily: font,
            }}
          >
            buildbase.io
          </div>

          {/* BB badge — cream pill matching the favicon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#F5EEE0",
              borderRadius: 10,
              padding: "8px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 34,
                fontWeight: 700,
                color: "#1C3A2A",
                fontFamily: font,
                lineHeight: 1,
              }}
            >
              B
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                fontWeight: 700,
                color: "#C84B1A",
                fontFamily: font,
                lineHeight: 1,
              }}
            >
              B
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [
            {
              name: "Space Grotesk",
              data: fontData,
              weight: 700 as const,
              style: "normal" as const,
            },
          ]
        : undefined,
    }
  );
}

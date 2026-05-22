"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin section error boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          background: "#E8DECE",
          border: "1px solid #C8B99D",
          borderRadius: "12px",
          padding: "48px 32px",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "16px",
          }}
          aria-hidden="true"
        >
          &#9888;
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#2C1A10",
            marginBottom: "8px",
            fontFamily: "var(--font-space-grotesk, Space Grotesk, sans-serif)",
          }}
        >
          Admin panel error
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#6B5A48",
            marginBottom: "32px",
            lineHeight: 1.5,
          }}
        >
          Something went wrong in the admin section. No changes were saved. Try
          again or refresh the page.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#C84B1A",
            color: "#FEFCF8",
            border: "none",
            borderRadius: "8px",
            padding: "12px 32px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

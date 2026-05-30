"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-base)",
        padding: "24px",
        fontFamily: "var(--font-inter, Inter, sans-serif)",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-subtle)",
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
            color: "var(--color-content-primary)",
            marginBottom: "8px",
            fontFamily: "var(--font-space-grotesk, Space Grotesk, sans-serif)",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--color-content-secondary)",
            marginBottom: "32px",
            lineHeight: 1.5,
          }}
        >
          An unexpected error occurred. Please try again or refresh the page.
        </p>
        <button
          onClick={reset}
          style={{
            background: "var(--color-accent)",
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

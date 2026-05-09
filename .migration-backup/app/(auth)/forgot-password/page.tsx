"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/auth-validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#E8DECE",
          border: "1px solid #2D7A3A",
          borderRadius: 12,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#2C1A10",
            marginBottom: 8,
            fontFamily: "var(--font-display, sans-serif)",
          }}
        >
          Check your email
        </h2>
        <p style={{ color: "#6B5A48", fontSize: 14, lineHeight: 1.6 }}>
          If <strong style={{ color: "#2C1A10" }}>{email}</strong> is registered, you&apos;ll
          receive a password reset link shortly.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            marginTop: 20,
            fontSize: 13,
            color: "#C84B1A",
            textDecoration: "none",
          }}
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        background: "#E8DECE",
        border: "1px solid #C8B99D",
        borderRadius: 12,
        padding: 32,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#2C1A10",
            fontFamily: "var(--font-display, sans-serif)",
            marginBottom: 4,
          }}
        >
          Reset your password
        </h1>
        <p style={{ color: "#6B5A48", fontSize: 14 }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "#6B5A48" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              background: "#EDE4D3",
              border: "1px solid #C8B99D",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#2C1A10",
              fontSize: 14,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "#B83020",
              background: "#E8DECE",
              border: "1px solid #B83020",
              borderRadius: 6,
              padding: "8px 12px",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#8C3410" : "#C84B1A",
            color: "#FEFCF8",
            border: "none",
            borderRadius: 8,
            padding: "11px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
            marginTop: 4,
            transition: "background 0.15s",
          }}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <Link
          href="/login"
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#6B5A48",
            textDecoration: "none",
            marginTop: 4,
          }}
        >
          ← Back to sign in
        </Link>
      </form>
    </div>
  );
}

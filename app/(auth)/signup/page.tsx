"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateSignupForm } from "@/lib/auth-validation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateSignupForm(email, password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
          background: "#1C2A20",
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
            color: "#E8F0E8",
            marginBottom: 8,
            fontFamily: "var(--font-display, sans-serif)",
          }}
        >
          Check your email
        </h2>
        <p style={{ color: "#8A9E8A", fontSize: 14, lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: "#E8F0E8" }}>{email}</strong>.
          Click it to activate your account.
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
        background: "#1C2A20",
        border: "1px solid #2A3D30",
        borderRadius: 12,
        padding: 32,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#E8F0E8",
            fontFamily: "var(--font-display, sans-serif)",
            marginBottom: 4,
          }}
        >
          Create your account
        </h1>
        <p style={{ color: "#8A9E8A", fontSize: 14 }}>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "#C84B1A", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "#8A9E8A" }}>
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
              background: "#0F1A14",
              border: "1px solid #2A3D30",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#E8F0E8",
              fontSize: 14,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#8A9E8A" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            style={{
              background: "#0F1A14",
              border: "1px solid #2A3D30",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#E8F0E8",
              fontSize: 14,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="confirm" style={{ fontSize: 13, fontWeight: 500, color: "#8A9E8A" }}>
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              background: "#0F1A14",
              border: "1px solid #2A3D30",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#E8F0E8",
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
              background: "#1C2A20",
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
            color: "#E8F0E8",
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}

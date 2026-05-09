import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Dumbbell, BarChart3, Shield, ChevronRight } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "#EDE4D3" }}
    >
      {/* Nav */}
      <nav
        style={{
          background: "#E5DAC8",
          borderBottom: "1px solid #C8B99D",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "var(--font-space-grotesk, sans-serif)",
          }}
        >
          <span style={{ color: "#1C3A2A" }}>Build</span>
          <span style={{ color: "#C84B1A" }}>Base</span>
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/login"
            style={{
              fontSize: 14,
              color: "#2C1A10",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #C8B99D",
              transition: "background 0.15s",
            }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              padding: "8px 20px",
              borderRadius: 8,
              background: "#C84B1A",
              transition: "background 0.15s",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ paddingTop: 80, paddingBottom: 80 }}
      >
        <h1
          className="text-5xl sm:text-6xl font-bold tracking-tight mb-6"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          <span style={{ color: "#1C3A2A" }}>Build</span>
          <span style={{ color: "#C84B1A" }}>Base</span>
        </h1>
        <p
          className="text-xl sm:text-2xl max-w-lg mb-4"
          style={{ color: "#2C1A10", lineHeight: 1.5 }}
        >
          Structured fitness coaching,{" "}
          <span style={{ color: "#C84B1A", fontWeight: 600 }}>simplified</span>.
        </p>
        <p
          className="text-base max-w-md mb-10"
          style={{ color: "#6B5A48", lineHeight: 1.6 }}
        >
          12-week strength programs with guided sessions, real-time set logging,
          and coach-driven form assessments — all in one place.
        </p>
        <Link
          href="/signup"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            padding: "12px 32px",
            borderRadius: 10,
            background: "#C84B1A",
            transition: "background 0.15s",
          }}
        >
          Start Training <ChevronRight size={18} />
        </Link>
      </section>

      {/* Feature cards */}
      <section
        style={{ padding: "0 24px 80px", maxWidth: 900, margin: "0 auto", width: "100%" }}
      >
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <FeatureCard
            icon={<Dumbbell size={24} />}
            title="Guided Sessions"
            description="Pre-programmed workouts with default weights tuned to your tier and gender. Just show up and lift."
          />
          <FeatureCard
            icon={<BarChart3 size={24} />}
            title="Track Everything"
            description="Log sets in real-time with +/- controls. Effort scores, soreness prompts, and progress over time."
          />
          <FeatureCard
            icon={<Shield size={24} />}
            title="Coach Connected"
            description="Your coach monitors form, sends notes, and adjusts your program — you see 'Solid Form' when you nail it."
          />
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #C8B99D",
          padding: "16px 24px",
          textAlign: "center",
          color: "#988A78",
          fontSize: 12,
        }}
      >
        <span style={{ color: "#1C3A2A" }}>Build</span>
        <span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
        <span> — structured strength coaching</span>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: "#E8DECE",
        border: "1px solid #C8B99D",
        borderRadius: 12,
        padding: "24px 20px",
      }}
    >
      <div style={{ color: "#C84B1A", marginBottom: 12 }}>{icon}</div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#2C1A10",
          marginBottom: 8,
          fontFamily: "var(--font-space-grotesk, sans-serif)",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 13, color: "#6B5A48", lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}

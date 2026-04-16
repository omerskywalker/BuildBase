// TODO Batch 2: Onboarding wizard — collects full_name, gender, confirms template_tier.
// Sets onboarding_done = true on completion. Until then, all app routes redirect here.
export default function OnboardingPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#0F1A14" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#1C2A20",
          border: "1px solid #2A3D30",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#E8F0E8",
            fontFamily: "var(--font-display, sans-serif)",
            marginBottom: 8,
          }}
        >
          Welcome to{" "}
          <span style={{ color: "#1C3A2A" }}>Build</span>
          <span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
        </h1>
        <p style={{ color: "#8A9E8A", fontSize: 14, lineHeight: 1.6 }}>
          Onboarding wizard coming in Batch 2. You&apos;ll set your name, gender, and training
          tier here.
        </p>
      </div>
    </main>
  );
}

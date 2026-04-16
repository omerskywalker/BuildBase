import OnboardingForm from "./OnboardingForm"

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-bg-base">
      <div className="w-full max-w-md bg-bg-elevated border border-border-subtle rounded-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-content-primary font-display mb-2">
            Welcome to{" "}
            <span style={{ color: "#1C3A2A" }}>Build</span>
            <span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
          </h1>
          <p className="text-sm text-content-secondary leading-relaxed">
            Let&apos;s get you set up with your personalized strength training program.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  )
}
export default function HomePage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "#0F1A14" }}
    >
      <div className="text-center">
        <h1
          className="text-5xl font-bold tracking-tight mb-4"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          <span style={{ color: "#1C3A2A" }}>Build</span>
          <span style={{ color: "#C84B1A" }}>Base</span>
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: "#8A9E8A" }}
        >
          Structured fitness coaching — coming soon.
        </p>
        <div
          className="inline-block px-4 py-1.5 rounded-full text-sm"
          style={{
            background: "#1C2A20",
            border: "1px solid #2A3D30",
            color: "#8A9E8A",
          }}
        >
          Setting up...
        </div>
      </div>
    </main>
  );
}

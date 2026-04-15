export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#0F1A14" }}
    >
      {children}
    </main>
  );
}

// TODO Batch 1: Protected layout — verify auth, redirect if no session
// Will include Sidebar + Header components
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0F1A14" }}>
      {/* TODO: <Sidebar /> */}
      <div className="lg:ml-[220px] flex flex-col min-h-screen">
        {/* TODO: <Header /> */}
        <main className="flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

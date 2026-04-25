import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, coach_id, onboarding_done")
    .eq("id", user.id)
    .single();

  // Redirect to onboarding if first login
  if (profile && !profile.onboarding_done) {
    redirect("/onboarding");
  }

  const role = profile?.role ?? "user";
  const fullName = profile?.full_name ?? profile?.email ?? "User";
  const hasCoach = profile?.coach_id != null;

  return (
    <div style={{ minHeight: "100vh", background: "#EDE4D3" }}>
      <Sidebar role={role} hasCoach={hasCoach} />
      <div className="lg:ml-[220px] flex flex-col min-h-screen">
        <Header fullName={fullName} />
        <main className="flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

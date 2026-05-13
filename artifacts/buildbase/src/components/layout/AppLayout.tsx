import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) { navigate("/login"); return; }
      if (profile && !profile.onboarding_done) { navigate("/onboarding"); return; }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#EDE4D3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-2 border-t-[#C84B1A] border-[#C8B99D] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const fullName = profile.full_name ?? profile.email ?? "User";
  const hasCoach = profile.coach_id != null;

  return (
    <div style={{ minHeight: "100vh", background: "#EDE4D3" }}>
      <Sidebar role={profile.role} hasCoach={hasCoach} />
      <div className="lg:ml-[220px] flex flex-col min-h-screen">
        <Header fullName={fullName} />
        <main className="flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

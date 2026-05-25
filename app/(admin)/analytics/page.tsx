import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "./analytics-dashboard";

interface AnalyticsData {
  totalAthletes: number;
  activeAthletes: number;
  weeklyCompletionRate: number;
  coachWorkload: Array<{ coachId: string; name: string; clientCount: number }>;
  newSignups: number;
  recentSessions: number;
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Total athletes
  const { count: totalAthletes } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "user");

  // Active athletes
  const { count: activeAthletes } = await supabase
    .from("user_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Weekly completion rate
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: totalRecentSessions } = await supabase
    .from("session_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  const { count: completedRecentSessions } = await supabase
    .from("session_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo)
    .eq("is_complete", true);

  const weeklyCompletionRate = totalRecentSessions && totalRecentSessions > 0
    ? Math.round((completedRecentSessions ?? 0) / totalRecentSessions * 100)
    : 0;

  // Coach workload
  const { data: coaches } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("role", ["coach", "admin"]);

  const coachWorkload: Array<{ coachId: string; name: string; clientCount: number }> = [];

  if (coaches) {
    for (const coach of coaches) {
      const { count: clientCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coach.id);

      coachWorkload.push({
        coachId: coach.id,
        name: coach.full_name || coach.email,
        clientCount: clientCount ?? 0,
      });
    }
  }

  // New signups (30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newSignups } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo);

  return {
    totalAthletes: totalAthletes ?? 0,
    activeAthletes: activeAthletes ?? 0,
    weeklyCompletionRate,
    coachWorkload,
    newSignups: newSignups ?? 0,
    recentSessions: totalRecentSessions ?? 0,
  };
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
          Analytics
        </h1>
        <p style={{ color: "#6B5A48", fontSize: 14 }}>
          Platform overview and coach workload metrics
        </p>
      </div>

      <AnalyticsDashboard data={data} />
    </div>
  );
}

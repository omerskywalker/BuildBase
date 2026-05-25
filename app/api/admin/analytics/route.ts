import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Total athletes (profiles where role = 'user')
    const { count: totalAthletes } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    // Active athletes (users with active enrollment)
    const { count: activeAthletes } = await supabase
      .from("user_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Weekly completion rate: % of session_logs completed in last 7 days
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

    // Coach workload: each coach and their client count
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

    // New signups in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    // Recent sessions (session_logs created in last 7 days)
    const recentSessions = totalRecentSessions ?? 0;

    return NextResponse.json({
      totalAthletes: totalAthletes ?? 0,
      activeAthletes: activeAthletes ?? 0,
      weeklyCompletionRate,
      coachWorkload,
      newSignups: newSignups ?? 0,
      recentSessions,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

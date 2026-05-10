import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, TrendingUp, BarChart3, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { calculateCurrentStreak, calculateCompletionRate } from "@/lib/milestone-utils";
import StreakBadge from "@/components/StreakBadge";
import CoachNotesBanner from "@/components/CoachNotesBanner";
import type { SessionLog, WorkoutTemplate } from "@/lib/types";

interface DashboardData {
  nextTemplate: WorkoutTemplate | null;
  nextWeek: number | null;
  completedCount: number;
  totalSessions: number;
  streak: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noEnrollment, setNoEnrollment] = useState(false);

  const hasCoach = profile?.coach_id != null;
  const isUser = profile?.role === "user";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setData(d))
      .catch(() => setNoEnrollment(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "#2C1A10" }}>Welcome back, {firstName}</h1>
        <p className="text-sm mb-6" style={{ color: "#6B5A48" }}>Your strength training home base</p>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 rounded-lg animate-pulse" style={{ background: "#E0D4C0" }} />
            <div className="h-48 rounded-lg animate-pulse" style={{ background: "#E0D4C0" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "#2C1A10" }}>Welcome back, {firstName}</h1>
      <p className="text-sm mb-6" style={{ color: "#6B5A48" }}>Your strength training home base</p>

      {isUser && hasCoach && <CoachNotesBanner />}

      {noEnrollment || !data ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4" style={{ color: "#988A78" }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#2C1A10" }}>No program assigned yet</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#6B5A48" }}>
              Your training program hasn't been set up yet. Once your coach or admin assigns you a program, your sessions and progress will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Dumbbell className="h-5 w-5" style={{ color: "#C84B1A" }} />Next Session</CardTitle>
                  {data.nextTemplate && (
                    <Link href={`/sessions?week=${data.nextWeek}`} className="text-xs flex items-center gap-0.5" style={{ color: "#C84B1A" }}>Go <ChevronRight className="h-3 w-3" /></Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {data.nextTemplate ? (
                  <div>
                    <div className="text-lg font-semibold" style={{ color: "#2C1A10" }}>{data.nextTemplate.title}</div>
                    <div className="text-sm mt-1" style={{ color: "#6B5A48" }}>Week {data.nextTemplate.week_number} · Day {data.nextTemplate.day_label}</div>
                    <Link href={`/sessions?week=${data.nextWeek}`} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#C84B1A" }}>
                      <Dumbbell className="h-4 w-4" /> Start Workout
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "#988A78" }}>All sessions complete — you finished the program!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" style={{ color: "#2D7A3A" }} />Progress</CardTitle>
                  <Link href="/progress" className="text-xs flex items-center gap-0.5" style={{ color: "#C84B1A" }}>Details <ChevronRight className="h-3 w-3" /></Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: "#2C1A10" }}>{calculateCompletionRate(data.completedCount, data.totalSessions)}%</div>
                    <div className="text-xs" style={{ color: "#6B5A48" }}>{data.completedCount} of {data.totalSessions} sessions</div>
                  </div>
                  <StreakBadge streak={data.streak} />
                </div>
                <div className="w-full rounded-full h-2" style={{ background: "#C8B99D" }}>
                  <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${calculateCompletionRate(data.completedCount, data.totalSessions)}%`, background: "#2D7A3A" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/sessions", icon: <Dumbbell className="h-5 w-5" />, title: "Sessions", subtitle: "Log your workouts" },
              { href: "/progress", icon: <TrendingUp className="h-5 w-5" />, title: "Progress", subtitle: "Phase overview" },
              { href: "/progress/charts", icon: <BarChart3 className="h-5 w-5" />, title: "Lift Charts", subtitle: "Track your lifts" },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div style={{ color: "#C84B1A" }}>{item.icon}</div>
                    <div><div className="text-sm font-medium" style={{ color: "#2C1A10" }}>{item.title}</div><div className="text-xs" style={{ color: "#988A78" }}>{item.subtitle}</div></div>
                    <ChevronRight className="h-4 w-4 ml-auto" style={{ color: "#988A78" }} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

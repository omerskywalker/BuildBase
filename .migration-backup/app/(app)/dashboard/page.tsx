import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, TrendingUp, BarChart3, ChevronRight } from "lucide-react";
import { calculateCurrentStreak } from "@/lib/milestone-utils";
import { calculateProgressPercentage } from "@/lib/progress-utils";
import StreakBadge from "@/components/StreakBadge";
import CoachNotesBanner from "@/components/CoachNotesBanner";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, coach_id, full_name")
    .eq("id", user.id)
    .single();

  const hasCoach = profile?.coach_id !== null;
  const isUser = profile?.role === "user";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div>
      <h1 className="text-2xl font-bold text-content-primary font-display mb-1">
        Welcome back, {firstName}
      </h1>
      <p className="text-sm text-content-secondary mb-6">
        Your strength training home base
      </p>

      {isUser && hasCoach && <CoachNotesBanner />}

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardWidgets userId={user.id} />
      </Suspense>
    </div>
  );
}

async function DashboardWidgets({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("user_enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!enrollment) {
    return <NoEnrollmentState />;
  }

  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("program_id", enrollment.program_id)
    .order("phase_number");

  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*")
    .in("phase_id", (phases ?? []).map(p => p.id))
    .order("session_number");

  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select("*")
    .eq("user_id", userId)
    .order("session_number", { ascending: true });

  const allTemplates = templates ?? [];
  const allLogs = sessionLogs ?? [];
  const completedLogs = allLogs.filter(l => l.is_complete);

  const completedCount = completedLogs.length;
  const totalSessions = allTemplates.length;
  const progressPct = calculateProgressPercentage(completedCount, totalSessions);
  const streak = calculateCurrentStreak(allLogs);

  const completedTemplateIds = new Set(completedLogs.map(l => l.workout_template_id));
  const nextTemplate = allTemplates.find(t => !completedTemplateIds.has(t.id));

  const nextWeek = nextTemplate
    ? Math.ceil(nextTemplate.session_number / 3)
    : null;

  return (
    <div className="space-y-6">
      {/* Top row: Next Session + Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Session */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-accent" />
                Next Session
              </CardTitle>
              {nextTemplate && (
                <Link
                  href={`/sessions?week=${nextWeek}`}
                  className="text-xs text-accent hover:text-accent-dim transition-colors flex items-center gap-0.5"
                >
                  Go <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {nextTemplate ? (
              <div>
                <div className="text-lg font-semibold text-content-primary">
                  {nextTemplate.title}
                </div>
                <div className="text-sm text-content-secondary mt-1">
                  Week {nextTemplate.week_number} · Day {nextTemplate.day_label}
                </div>
                <Link
                  href={`/sessions?week=${nextWeek}`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-button-text rounded-lg hover:bg-accent-dim transition-colors text-sm font-medium"
                >
                  <Dumbbell className="h-4 w-4" />
                  Start Workout
                </Link>
              </div>
            ) : (
              <p className="text-content-muted text-sm">
                All sessions complete — you finished the program!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Progress
              </CardTitle>
              <Link
                href="/progress"
                className="text-xs text-accent hover:text-accent-dim transition-colors flex items-center gap-0.5"
              >
                Details <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-content-primary">{progressPct}%</div>
                <div className="text-xs text-content-secondary">
                  {completedCount} of {totalSessions} sessions
                </div>
              </div>
              <StreakBadge streak={streak} />
            </div>
            <div className="w-full bg-bg-surface rounded-full h-2">
              <div
                className="bg-success h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink
          href="/sessions"
          icon={<Dumbbell className="h-5 w-5" />}
          title="Sessions"
          subtitle="Log your workouts"
        />
        <QuickLink
          href="/progress"
          icon={<TrendingUp className="h-5 w-5" />}
          title="Progress"
          subtitle="Phase overview"
        />
        <QuickLink
          href="/progress/charts"
          icon={<BarChart3 className="h-5 w-5" />}
          title="Lift Charts"
          subtitle="Track your lifts"
        />
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, subtitle }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-bg-hover transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="text-accent">{icon}</div>
          <div>
            <div className="text-sm font-medium text-content-primary">{title}</div>
            <div className="text-xs text-content-muted">{subtitle}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-content-muted ml-auto" />
        </CardContent>
      </Card>
    </Link>
  );
}

function NoEnrollmentState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Dumbbell className="h-12 w-12 text-content-muted mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-content-primary mb-2">
          No program assigned yet
        </h2>
        <p className="text-sm text-content-secondary max-w-md mx-auto">
          Your training program hasn&apos;t been set up yet. Once your coach or admin assigns
          you a program, your sessions and progress will appear here.
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-bg-elevated rounded-lg animate-pulse" />
        <div className="h-48 bg-bg-elevated rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
        <div className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
        <div className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

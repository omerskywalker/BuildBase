import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { calculateProgressPercentage } from "@/lib/progress-utils";
import { calculateCurrentStreak } from "@/lib/milestone-utils";
import StreakBadge from "@/components/StreakBadge";
import type { PhaseProgress, OverallProgress } from "@/lib/progress-utils";
import type { SessionLog } from "@/lib/types";

interface ProgressData extends OverallProgress { sessionLogs: SessionLog[]; }

function PhaseCard({ phase, isCurrentPhase }: { phase: PhaseProgress; isCurrentPhase: boolean }) {
  const pct = calculateProgressPercentage(phase.completedSessions, phase.totalSessions);
  return (
    <Card className={cn("transition-all", isCurrentPhase && "ring-1 ring-offset-2")} style={{ ...(isCurrentPhase ? { "--tw-ring-color": "#C84B1A" } as React.CSSProperties : {}) }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: isCurrentPhase ? "#C84B1A" : "#DDD2BF", color: isCurrentPhase ? "#FEFCF8" : "#6B5A48" }}>Phase {phase.phase_number}</span>
              {phase.name}
            </CardTitle>
            {phase.subtitle && <p className="text-sm mt-1" style={{ color: "#6B5A48" }}>{phase.subtitle}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: "#2C1A10" }}>{pct}%</div>
            <div className="text-xs" style={{ color: "#6B5A48" }}>{phase.completedSessions} of {phase.totalSessions}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full rounded-full h-2" style={{ background: "#C8B99D" }}>
          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "#2D7A3A" }} />
        </div>
        <div>
          <div className="text-sm font-medium mb-2" style={{ color: "#2C1A10" }}>Sessions (Weeks {phase.week_start}–{phase.week_end})</div>
          <div className="grid grid-cols-6 gap-2">
            {phase.sessions.map(s => (
              <div key={s.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ background: s.isComplete ? "#2D7A3A" : s.isCurrent ? "#C84B1A" : "#E0D4C0", color: s.isComplete || s.isCurrent ? "#FEFCF8" : "#988A78", border: s.isCurrent ? "2px solid #C84B1A" : "none" }}>
                {s.session_number}
              </div>
            ))}
          </div>
        </div>
        {phase.description && <p className="text-sm" style={{ color: "#6B5A48" }}>{phase.description}</p>}
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/progress").then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "#2C1A10" }}>Progress</h1>
          <p className="text-sm" style={{ color: "#6B5A48" }}>Track your journey through your 12-week strength program</p>
        </div>
        <div className="flex gap-2">
          <Link href="/progress/charts" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: "#C84B1A" }}>
            <TrendingUp size={16} /> View Charts
          </Link>
          <Link href="/progress/milestones"><Button variant="outline" size="sm" className="gap-2"><Trophy className="h-4 w-4" />Milestones</Button></Link>
          <Link href="/progress/trends" className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: "#1C3A2A" }}>
            <TrendingUp className="w-4 h-4" /> Trends
          </Link>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-content-secondary">Loading progress...</div>}

      {!loading && data && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Program Overview</CardTitle>
              <div className="flex items-center justify-between mt-4">
                <div>
                  <div className="text-3xl font-bold" style={{ color: "#2C1A10" }}>{calculateProgressPercentage(data.overallCompleted, data.overallTotal)}%</div>
                  <div className="text-sm" style={{ color: "#6B5A48" }}>Complete</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold" style={{ color: "#2C1A10" }}>{data.overallCompleted} of {data.overallTotal}</div>
                  <div className="text-sm" style={{ color: "#6B5A48" }}>Sessions</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full rounded-full h-3" style={{ background: "#C8B99D" }}>
                <div className="h-3 rounded-full" style={{ width: `${calculateProgressPercentage(data.overallCompleted, data.overallTotal)}%`, background: "#2D7A3A" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#6B5A48" }}>Current streak:</span>
                <StreakBadge streak={calculateCurrentStreak(data.sessionLogs)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {data.phases.map(phase => <PhaseCard key={phase.id} phase={phase} isCurrentPhase={phase.phase_number === data.currentPhase} />)}
          </div>
        </div>
      )}
    </div>
  );
}

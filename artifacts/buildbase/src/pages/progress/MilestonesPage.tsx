import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import StreakBadge from "@/components/StreakBadge";
import MilestoneCard from "@/components/MilestoneCard";
import { MILESTONE_DEFINITIONS, type MilestoneDefinition } from "@/lib/milestone-utils";
import type { PersonalRecord, Milestone } from "@/lib/types";

interface MilestoneData {
  currentStreak: number; completionRate: number; totalSessions: number;
  completedSessions: number;
  personalRecords: (PersonalRecord & { exercise: { name: string } })[];
  milestones: Milestone[];
}

const CATEGORY_TITLES = { consistency: "Consistency", strength: "Strength", progress: "Progress", completion: "Completion" };

export default function MilestonesPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<MilestoneData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/progress/milestones").then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div><h1 className="text-2xl font-bold font-display mb-6" style={{ color: "#2C1A10" }}>Milestones & Achievements</h1><div className="text-center py-8" style={{ color: "#6B5A48" }}>Loading achievements...</div></div>;

  const achievedMap = new Map((data?.milestones ?? []).map(m => [m.milestone_key, m]));
  const grouped = Object.entries(CATEGORY_TITLES).map(([cat, title]) => ({ cat, title, items: MILESTONE_DEFINITIONS.filter(d => d.category === (cat as MilestoneDefinition["category"])).map(d => ({ definition: d, achieved: achievedMap.get(d.key) })) }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "#2C1A10" }}>Milestones & Achievements</h1>
        <p className="text-sm" style={{ color: "#6B5A48" }}>Track your streaks, personal records, and program milestones</p>
      </div>

      {data && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Current Streak</CardTitle></CardHeader><CardContent><StreakBadge streak={data.currentStreak} /></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Completion Rate</CardTitle></CardHeader><CardContent>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold" style={{ color: "#2C1A10" }}>{data.completionRate}%</span><span className="text-sm" style={{ color: "#6B5A48" }}>complete</span></div>
              <p className="text-xs mt-1" style={{ color: "#988A78" }}>{data.completedSessions} of {data.totalSessions} sessions</p>
            </CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Personal Records</CardTitle></CardHeader><CardContent>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold" style={{ color: "#2C1A10" }}>{data.personalRecords.length}</span><span className="text-sm" style={{ color: "#6B5A48" }}>PRs set</span></div>
              {data.personalRecords[0] && <p className="text-xs mt-1" style={{ color: "#988A78" }}>Latest: {data.personalRecords[0].exercise.name}</p>}
            </CardContent></Card>
          </div>

          {data.personalRecords.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-xl">Personal Records Board</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.personalRecords.slice(0, 6).map(pr => (
                    <div key={pr.id} className="flex items-center justify-between p-3 rounded-lg border border-border-subtle" style={{ background: "#F7F3EE" }}>
                      <div><h4 className="font-medium text-sm" style={{ color: "#2C1A10" }}>{pr.exercise.name}</h4><p className="text-xs" style={{ color: "#6B5A48" }}>{new Date(pr.achieved_at).toLocaleDateString()}</p></div>
                      <div className="text-right"><p className="font-bold text-sm" style={{ color: "#C84B1A" }}>{pr.weight === 0 ? `${pr.reps} reps (BW)` : `${pr.weight} lbs × ${pr.reps} reps`}</p><p className="text-xs" style={{ color: "#2D7A3A" }}>🏆 PR</p></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {grouped.map(({ cat, title, items }) => (
            <Card key={cat}>
              <CardHeader><CardTitle className="text-xl">{title} Milestones</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(({ definition, achieved }) => (
                    <MilestoneCard key={definition.key} milestoneKey={definition.key} isAchieved={!!achieved} achievedAt={achieved?.achieved_at} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader><CardTitle className="text-xl">Achievement Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3"><span className="text-sm" style={{ color: "#6B5A48" }}>Milestones achieved</span><span className="text-sm font-medium" style={{ color: "#2C1A10" }}>{data.milestones.length} of {MILESTONE_DEFINITIONS.length}</span></div>
              <div className="w-full rounded-full h-2" style={{ background: "#C8B99D" }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${(data.milestones.length / MILESTONE_DEFINITIONS.length) * 100}%`, background: "#2D7A3A" }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

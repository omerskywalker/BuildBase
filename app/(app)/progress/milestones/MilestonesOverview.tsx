import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StreakBadge from "@/components/StreakBadge";
import MilestoneCard from "@/components/MilestoneCard";
import { 
  calculateCurrentStreak, 
  calculateCompletionRate, 
  MILESTONE_DEFINITIONS,
  type MilestoneDefinition 
} from "@/lib/milestone-utils";
import type { 
  SessionLog, 
  PersonalRecord, 
  Milestone, 
  UserEnrollment,
  Exercise
} from "@/lib/types";

interface MilestoneData {
  currentStreak: number;
  completionRate: number;
  totalSessions: number;
  completedSessions: number;
  personalRecords: (PersonalRecord & { exercise: Pick<Exercise, 'name'> })[];
  milestones: Milestone[];
}

async function getMilestoneData(userId: string): Promise<MilestoneData> {
  const supabase = await createClient();

  // Get user enrollment to determine total sessions
  const { data: enrollment } = await supabase
    .from("user_enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!enrollment) {
    throw new Error("No active enrollment found");
  }

  // Get all session logs for streak and completion calculation
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select("*")
    .eq("user_id", userId)
    .order("week_number", { ascending: true })
    .order("session_number", { ascending: true });

  // Get personal records with exercise names
  const { data: personalRecords } = await supabase
    .from("personal_records")
    .select(`
      *,
      exercise:exercises(name)
    `)
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });

  // Get achieved milestones
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });

  const sessionLogsData = sessionLogs || [];
  const completedSessions = sessionLogsData.filter(log => log.is_complete);
  
  // Calculate total sessions in program (12 weeks × 3 sessions = 36 sessions)
  const totalSessions = 36;

  return {
    currentStreak: calculateCurrentStreak(sessionLogsData),
    completionRate: calculateCompletionRate(completedSessions.length, totalSessions),
    totalSessions,
    completedSessions: completedSessions.length,
    personalRecords: personalRecords || [],
    milestones: milestones || []
  };
}

function groupMilestonesByCategory(
  definitions: MilestoneDefinition[], 
  achievedMilestones: Milestone[]
): Record<MilestoneDefinition['category'], { definition: MilestoneDefinition, achieved?: Milestone }[]> {
  const achievedMap = new Map(achievedMilestones.map(m => [m.milestone_key, m]));
  
  return definitions.reduce((acc, definition) => {
    const category = definition.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push({
      definition,
      achieved: achievedMap.get(definition.key)
    });
    
    return acc;
  }, {} as Record<MilestoneDefinition['category'], { definition: MilestoneDefinition, achieved?: Milestone }[]>);
}

function formatWeight(weight: number, reps: number): string {
  if (weight === 0) return `${reps} reps (bodyweight)`;
  return `${weight} lbs × ${reps} reps`;
}

export default async function MilestonesOverview({ userId }: { userId: string }) {
  try {
    const data = await getMilestoneData(userId);
    const groupedMilestones = groupMilestonesByCategory(MILESTONE_DEFINITIONS, data.milestones);
    
    const categoryTitles = {
      consistency: "Consistency",
      strength: "Strength",
      progress: "Progress", 
      completion: "Completion"
    };

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <StreakBadge streak={data.currentStreak} />
              {data.currentStreak > 0 && (
                <p className="text-xs text-content-secondary mt-2">
                  Keep it going! 🎯
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-content-primary">{data.completionRate}%</span>
                <span className="text-sm text-content-secondary">complete</span>
              </div>
              <p className="text-xs text-content-secondary mt-1">
                {data.completedSessions} of {data.totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Personal Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-content-primary">{data.personalRecords.length}</span>
                <span className="text-sm text-content-secondary">PRs set</span>
              </div>
              {data.personalRecords.length > 0 && (
                <p className="text-xs text-content-secondary mt-1">
                  Latest: {data.personalRecords[0].exercise.name}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Personal Records Board */}
        {data.personalRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Personal Records Board</CardTitle>
              <p className="text-sm text-content-secondary">
                Your best lifts and achievements
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.personalRecords.slice(0, 6).map((pr) => (
                  <div
                    key={pr.id}
                    className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-border-subtle"
                  >
                    <div>
                      <h4 className="font-medium text-content-primary text-sm">
                        {pr.exercise.name}
                      </h4>
                      <p className="text-xs text-content-secondary">
                        {new Date(pr.achieved_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent text-sm">
                        {formatWeight(pr.weight, pr.reps)}
                      </p>
                      <p className="text-xs text-success">🏆 PR</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Milestones by Category */}
        {Object.entries(categoryTitles).map(([category, title]) => {
          const categoryMilestones = groupedMilestones[category as keyof typeof categoryTitles] || [];
          
          if (categoryMilestones.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-xl">{title} Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryMilestones.map(({ definition, achieved }) => (
                    <MilestoneCard
                      key={definition.key}
                      milestoneKey={definition.key}
                      isAchieved={!!achieved}
                      achievedAt={achieved?.achieved_at}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Achievement Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Achievement Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-content-secondary">Milestones achieved</span>
              <span className="text-sm font-medium text-content-primary">
                {data.milestones.length} of {MILESTONE_DEFINITIONS.length}
              </span>
            </div>
            <div className="w-full bg-bg-surface rounded-full h-2">
              <div
                className="bg-success h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(data.milestones.length / MILESTONE_DEFINITIONS.length) * 100}%` 
                }}
              />
            </div>
            <p className="text-xs text-content-secondary mt-2">
              Keep working towards your next milestone! 🎯
            </p>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading milestone data:", error);
    return (
      <div className="text-center py-8">
        <p className="text-content-secondary mb-4">
          Unable to load your achievements. Please try again later.
        </p>
      </div>
    );
  }
}
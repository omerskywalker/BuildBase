import { createClient } from "@/lib/supabase/server";
import TrendChart, { type TrendDataPoint } from "@/components/TrendChart";
import TrendsInsights from "./TrendsInsights";

interface TrendsViewProps {
  userId: string;
}

export default async function TrendsView({ userId }: TrendsViewProps) {
  const supabase = await createClient();

  // Fetch session logs with effort and soreness data
  const { data: sessions, error } = await supabase
    .from("session_logs")
    .select(`
      week_number,
      session_number,
      completed_at,
      post_session_effort,
      pre_session_soreness,
      workout_template_id
    `)
    .eq("user_id", userId)
    .eq("is_complete", true)
    .not("completed_at", "is", null)
    .order("week_number", { ascending: true })
    .order("session_number", { ascending: true });

  if (error) {
    console.error("Error fetching trend data:", error);
    return <div className="text-error">Failed to load trend data</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-elevated p-8 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-content-primary mb-2">
          No trend data yet
        </h3>
        <p className="text-content-secondary">
          Complete some sessions with effort and soreness ratings to see your trends.
        </p>
      </div>
    );
  }

  // Transform data for chart
  const chartData: TrendDataPoint[] = sessions.map((session, index) => {
    const date = new Date(session.completed_at!).toLocaleDateString();
    const sessionLabel = `W${session.week_number}S${session.session_number}`;
    
    return {
      session: sessionLabel,
      date,
      effort: session.post_session_effort || undefined,
      soreness: session.pre_session_soreness || undefined,
      week: session.week_number,
      sessionNumber: session.session_number,
    };
  });

  // Filter data for insights calculation
  const effortData = chartData.filter(d => d.effort !== undefined);
  const sorenessData = chartData.filter(d => d.soreness !== undefined);

  return (
    <div className="space-y-6">
      {/* Combined Chart */}
      {effortData.length > 0 && sorenessData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-content-primary mb-4">
            Effort & Soreness Over Time
          </h2>
          <TrendChart data={chartData} type="both" />
        </div>
      )}

      {/* Individual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {effortData.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-content-primary mb-4">
              Effort Levels
            </h2>
            <TrendChart data={chartData} type="effort" />
          </div>
        )}

        {sorenessData.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-content-primary mb-4">
              Soreness Patterns
            </h2>
            <TrendChart data={chartData} type="soreness" />
          </div>
        )}
      </div>

      {/* Insights */}
      <TrendsInsights 
        effortData={effortData} 
        sorenessData={sorenessData}
        allData={chartData}
      />
    </div>
  );
}
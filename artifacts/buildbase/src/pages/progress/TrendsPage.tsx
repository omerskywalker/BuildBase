import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import TrendChart, { type TrendDataPoint } from "@/components/TrendChart";

interface Insight { type: "positive" | "negative" | "neutral" | "warning"; title: string; description: string; }

function generateInsights(effortData: TrendDataPoint[], sorenessData: TrendDataPoint[]): Insight[] {
  const insights: Insight[] = [];
  if (effortData.length >= 3) {
    const vals = effortData.map(d => d.effort!);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 4) insights.push({ type: "positive", title: "Consistently high effort", description: `Average effort of ${avg.toFixed(1)}/5 shows strong commitment.` });
    else if (avg < 2.5) insights.push({ type: "warning", title: "Effort levels declining", description: "Consider increasing intensity or checking if you need a recovery break." });
  }
  if (sorenessData.length >= 3) {
    const vals = sorenessData.map(d => d.soreness!);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 4) insights.push({ type: "positive", title: "Good recovery patterns", description: `Average soreness of ${avg.toFixed(1)}/5 shows you're recovering well.` });
    else if (avg < 2.5) insights.push({ type: "warning", title: "Increased soreness pattern", description: "Consider adjusting intensity or focusing on recovery strategies." });
  }
  if (effortData.length < 5) insights.push({ type: "neutral", title: "Track more sessions", description: "Log effort and soreness consistently to generate meaningful insights." });
  return insights;
}

export default function TrendsPage() {
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/progress/trends").then(r => r.json()).then(d => setChartData(d.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const effortData = chartData.filter(d => d.effort !== undefined);
  const sorenessData = chartData.filter(d => d.soreness !== undefined);
  const insights = generateInsights(effortData, sorenessData);

  const insightStyle = (type: Insight["type"]) => ({
    positive: { border: "#2D7A3A", bg: "#F0FDF4", icon: <CheckCircle className="w-4 h-4" style={{ color: "#2D7A3A" }} /> },
    negative: { border: "#B83020", bg: "#FEF2F2", icon: <TrendingDown className="w-4 h-4" style={{ color: "#B83020" }} /> },
    warning: { border: "#C08030", bg: "#FFFBEB", icon: <AlertCircle className="w-4 h-4" style={{ color: "#C08030" }} /> },
    neutral: { border: "#6B5A48", bg: "#E8DECE", icon: <Activity className="w-4 h-4" style={{ color: "#6B5A48" }} /> },
  }[type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/progress" className="flex items-center gap-2 mb-2 text-sm" style={{ color: "#6B5A48" }}><ArrowLeft className="w-4 h-4" />Back to Progress</Link>
          <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "#2C1A10" }}>Effort & Soreness Trends</h1>
          <p className="text-sm" style={{ color: "#6B5A48" }}>Track your effort levels and soreness patterns over time</p>
        </div>
      </div>

      {loading && <div className="text-center py-8" style={{ color: "#6B5A48" }}>Loading trends...</div>}

      {!loading && chartData.length === 0 && (
        <div className="rounded-lg p-8 text-center" style={{ background: "#E8DECE" }}>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#2C1A10" }}>No trend data yet</h3>
          <p style={{ color: "#6B5A48" }}>Complete some sessions with effort and soreness ratings to see your trends.</p>
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <div className="space-y-6">
          {effortData.length > 0 && sorenessData.length > 0 && (
            <div><h2 className="text-lg font-semibold mb-4" style={{ color: "#2C1A10" }}>Effort & Soreness Over Time</h2><TrendChart data={chartData} type="both" /></div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {effortData.length > 0 && <div><h2 className="text-lg font-semibold mb-4" style={{ color: "#2C1A10" }}>Effort Levels</h2><TrendChart data={chartData} type="effort" /></div>}
            {sorenessData.length > 0 && <div><h2 className="text-lg font-semibold mb-4" style={{ color: "#2C1A10" }}>Soreness Patterns</h2><TrendChart data={chartData} type="soreness" /></div>}
          </div>
          {insights.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "#2C1A10" }}>Insights</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insights.map((insight, i) => {
                  const s = insightStyle(insight.type);
                  return (
                    <div key={i} className="p-4 rounded-lg border" style={{ borderColor: s.border, background: s.bg }}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{s.icon}</div>
                        <div><h3 className="font-medium mb-1" style={{ color: "#2C1A10" }}>{insight.title}</h3><p className="text-sm" style={{ color: "#6B5A48" }}>{insight.description}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

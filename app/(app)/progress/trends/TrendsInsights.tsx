"use client";

import { TrendDataPoint } from "@/components/TrendChart";
import { EFFORT_LABELS, SORENESS_LABELS } from "@/lib/constants";
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle } from "lucide-react";

interface TrendsInsightsProps {
  effortData: TrendDataPoint[];
  sorenessData: TrendDataPoint[];
  allData: TrendDataPoint[];
}

interface Insight {
  type: "positive" | "negative" | "neutral" | "warning";
  icon: React.ReactNode;
  title: string;
  description: string;
}

function calculateCorrelation(data: TrendDataPoint[]): number {
  // Find sessions where both effort and soreness exist
  const paired = data.filter(d => d.effort !== undefined && d.soreness !== undefined);
  if (paired.length < 3) return 0;

  const n = paired.length;
  const effortValues = paired.map(d => d.effort!);
  const sorenessValues = paired.map(d => d.soreness!);

  const sumX = effortValues.reduce((a, b) => a + b, 0);
  const sumY = sorenessValues.reduce((a, b) => a + b, 0);
  const sumXY = paired.reduce((sum, d) => sum + d.effort! * d.soreness!, 0);
  const sumX2 = effortValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = sorenessValues.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateTrend(values: number[]): "increasing" | "decreasing" | "stable" {
  if (values.length < 3) return "stable";
  
  const recent = values.slice(-3);
  const earlier = values.slice(0, Math.max(1, values.length - 3));
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  
  const diff = recentAvg - earlierAvg;
  
  if (Math.abs(diff) < 0.3) return "stable";
  return diff > 0 ? "increasing" : "decreasing";
}

function generateInsights(effortData: TrendDataPoint[], sorenessData: TrendDataPoint[], allData: TrendDataPoint[]): Insight[] {
  const insights: Insight[] = [];

  // Effort trend analysis
  if (effortData.length >= 3) {
    const effortValues = effortData.map(d => d.effort!);
    const effortTrend = calculateTrend(effortValues);
    const avgEffort = effortValues.reduce((a, b) => a + b, 0) / effortValues.length;

    if (effortTrend === "increasing" && avgEffort > 3) {
      insights.push({
        type: "positive",
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Effort levels are increasing",
        description: "You're pushing yourself harder in recent sessions. Great progress!"
      });
    } else if (effortTrend === "decreasing" && avgEffort < 3) {
      insights.push({
        type: "warning",
        icon: <TrendingDown className="w-4 h-4" />,
        title: "Effort levels declining",
        description: "Consider increasing intensity or checking if you need a recovery break."
      });
    } else if (avgEffort >= 4) {
      insights.push({
        type: "positive",
        icon: <Activity className="w-4 h-4" />,
        title: "Consistently high effort",
        description: `Average effort of ${avgEffort.toFixed(1)}/5 shows strong commitment.`
      });
    }
  }

  // Soreness trend analysis
  if (sorenessData.length >= 3) {
    const sorenessValues = sorenessData.map(d => d.soreness!);
    const sorenessTrend = calculateTrend(sorenessValues);
    const avgSoreness = sorenessValues.reduce((a, b) => a + b, 0) / sorenessValues.length;

    if (sorenessTrend === "increasing" && avgSoreness > 3.5) {
      insights.push({
        type: "positive",
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Recovery improving",
        description: "Your soreness levels are decreasing, indicating better recovery."
      });
    } else if (sorenessTrend === "decreasing" && avgSoreness < 2.5) {
      insights.push({
        type: "warning",
        icon: <AlertCircle className="w-4 h-4" />,
        title: "Increased soreness pattern",
        description: "Consider adjusting intensity or focusing on recovery strategies."
      });
    } else if (avgSoreness >= 4) {
      insights.push({
        type: "positive",
        icon: <CheckCircle className="w-4 h-4" />,
        title: "Good recovery patterns",
        description: `Average soreness of ${avgSoreness.toFixed(1)}/5 shows you're recovering well.`
      });
    }
  }

  // Effort-soreness correlation
  const correlation = calculateCorrelation(allData);
  if (Math.abs(correlation) > 0.3) {
    if (correlation > 0) {
      insights.push({
        type: "neutral",
        icon: <Activity className="w-4 h-4" />,
        title: "High effort → better recovery",
        description: "Harder sessions correlate with better next-day recovery. Your body responds well to intensity."
      });
    } else {
      insights.push({
        type: "neutral",
        icon: <AlertCircle className="w-4 h-4" />,
        title: "High effort → increased soreness",
        description: "Intense sessions tend to increase next-session soreness. Consider pacing or recovery focus."
      });
    }
  }

  // Data consistency insights
  const effortConsistency = effortData.length / Math.max(allData.length, 1);
  const sorenessConsistency = sorenessData.length / Math.max(allData.length, 1);

  if (effortConsistency < 0.7) {
    insights.push({
      type: "neutral",
      icon: <AlertCircle className="w-4 h-4" />,
      title: "Track effort more consistently",
      description: "Regular effort tracking helps identify optimal training intensity."
    });
  }

  if (sorenessConsistency < 0.7) {
    insights.push({
      type: "neutral",
      icon: <AlertCircle className="w-4 h-4" />,
      title: "Track soreness more consistently", 
      description: "Regular soreness tracking helps optimize recovery patterns."
    });
  }

  return insights;
}

export default function TrendsInsights({ effortData, sorenessData, allData }: TrendsInsightsProps) {
  const insights = generateInsights(effortData, sorenessData, allData);

  if (insights.length === 0) {
    return null;
  }

  const getInsightStyles = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "border-success bg-success/5";
      case "negative":
        return "border-error bg-error/5";
      case "warning":
        return "border-warning bg-warning/5";
      default:
        return "border-info bg-info/5";
    }
  };

  const getIconStyles = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-error";
      case "warning":
        return "text-warning";
      default:
        return "text-info";
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-content-primary mb-4">
        Insights
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getInsightStyles(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${getIconStyles(insight.type)}`}>
                {insight.icon}
              </div>
              <div>
                <h3 className="font-medium text-content-primary mb-1">
                  {insight.title}
                </h3>
                <p className="text-sm text-content-secondary">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
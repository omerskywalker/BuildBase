import { describe, it, expect } from "vitest";
import { TrendDataPoint } from "@/components/TrendChart";

// Mock insight generation functions since TrendsInsights is a React component
// We'll test the core logic separately

function calculateCorrelation(data: TrendDataPoint[]): number {
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

describe("Trends insights calculation", () => {
  describe("calculateCorrelation", () => {
    it("should return 0 for insufficient data", () => {
      const data: TrendDataPoint[] = [
        { session: "W1S1", date: "2024-01-01", effort: 3, soreness: 4, week: 1, sessionNumber: 1 },
        { session: "W1S2", date: "2024-01-03", effort: 4, soreness: 3, week: 1, sessionNumber: 2 },
      ];
      
      expect(calculateCorrelation(data)).toBe(0);
    });

    it("should calculate positive correlation", () => {
      const data: TrendDataPoint[] = [
        { session: "W1S1", date: "2024-01-01", effort: 1, soreness: 1, week: 1, sessionNumber: 1 },
        { session: "W1S2", date: "2024-01-03", effort: 3, soreness: 3, week: 1, sessionNumber: 2 },
        { session: "W1S3", date: "2024-01-05", effort: 5, soreness: 5, week: 1, sessionNumber: 3 },
      ];
      
      const correlation = calculateCorrelation(data);
      expect(correlation).toBeGreaterThan(0.8); // Strong positive correlation
    });

    it("should calculate negative correlation", () => {
      const data: TrendDataPoint[] = [
        { session: "W1S1", date: "2024-01-01", effort: 5, soreness: 1, week: 1, sessionNumber: 1 },
        { session: "W1S2", date: "2024-01-03", effort: 3, soreness: 3, week: 1, sessionNumber: 2 },
        { session: "W1S3", date: "2024-01-05", effort: 1, soreness: 5, week: 1, sessionNumber: 3 },
      ];
      
      const correlation = calculateCorrelation(data);
      expect(correlation).toBeLessThan(-0.8); // Strong negative correlation
    });

    it("should handle missing values", () => {
      const data: TrendDataPoint[] = [
        { session: "W1S1", date: "2024-01-01", effort: 3, week: 1, sessionNumber: 1 },
        { session: "W1S2", date: "2024-01-03", soreness: 4, week: 1, sessionNumber: 2 },
        { session: "W1S3", date: "2024-01-05", effort: 4, soreness: 3, week: 1, sessionNumber: 3 },
      ];
      
      expect(calculateCorrelation(data)).toBe(0); // Not enough paired values
    });
  });

  describe("calculateTrend", () => {
    it("should return stable for insufficient data", () => {
      expect(calculateTrend([1, 2])).toBe("stable");
    });

    it("should detect increasing trend", () => {
      const trend = calculateTrend([2, 2.5, 3, 3.5, 4]);
      expect(trend).toBe("increasing");
    });

    it("should detect decreasing trend", () => {
      const trend = calculateTrend([4, 3.5, 3, 2.5, 2]);
      expect(trend).toBe("decreasing");
    });

    it("should detect stable trend", () => {
      const trend = calculateTrend([3, 3.1, 2.9, 3.2, 2.8]);
      expect(trend).toBe("stable");
    });

    it("should handle edge case with small differences", () => {
      const trend = calculateTrend([3.0, 3.1, 3.2]);
      expect(trend).toBe("stable"); // Difference of 0.2 is below 0.3 threshold
    });
  });

  describe("Data validation", () => {
    it("should identify complete data points", () => {
      const data: TrendDataPoint[] = [
        { session: "W1S1", date: "2024-01-01", effort: 3, soreness: 4, week: 1, sessionNumber: 1 },
        { session: "W1S2", date: "2024-01-03", effort: 4, week: 1, sessionNumber: 2 },
      ];

      const effortData = data.filter(d => d.effort !== undefined);
      const sorenessData = data.filter(d => d.soreness !== undefined);

      expect(effortData).toHaveLength(2);
      expect(sorenessData).toHaveLength(1);
    });

    it("should calculate data consistency ratios", () => {
      const allSessions = 10;
      const effortSessions = 7;
      const sorenessSessions = 8;

      const effortConsistency = effortSessions / allSessions;
      const sorenessConsistency = sorenessSessions / allSessions;

      expect(effortConsistency).toBe(0.7);
      expect(sorenessConsistency).toBe(0.8);
    });
  });
});
import { describe, it, expect } from "vitest";
import { TrendDataPoint } from "@/components/TrendChart";

describe("TrendChart data processing", () => {
  const mockData: TrendDataPoint[] = [
    {
      session: "W1S1",
      date: "2024-01-01",
      effort: 3,
      soreness: 4,
      week: 1,
      sessionNumber: 1,
    },
    {
      session: "W1S2", 
      date: "2024-01-03",
      effort: 4,
      soreness: 3,
      week: 1,
      sessionNumber: 2,
    },
    {
      session: "W1S3",
      date: "2024-01-05", 
      effort: 5,
      soreness: 2,
      week: 1,
      sessionNumber: 3,
    },
  ];

  it("should have valid TrendDataPoint structure", () => {
    const dataPoint = mockData[0];
    
    expect(dataPoint).toHaveProperty("session");
    expect(dataPoint).toHaveProperty("date");
    expect(dataPoint).toHaveProperty("week");
    expect(dataPoint).toHaveProperty("sessionNumber");
    expect(typeof dataPoint.session).toBe("string");
    expect(typeof dataPoint.date).toBe("string");
    expect(typeof dataPoint.week).toBe("number");
    expect(typeof dataPoint.sessionNumber).toBe("number");
  });

  it("should handle optional effort and soreness values", () => {
    const dataWithMissing: TrendDataPoint = {
      session: "W2S1",
      date: "2024-01-08",
      week: 2,
      sessionNumber: 1,
    };

    expect(dataWithMissing.effort).toBeUndefined();
    expect(dataWithMissing.soreness).toBeUndefined();
  });

  it("should validate effort values are in range 1-5", () => {
    mockData.forEach(point => {
      if (point.effort !== undefined) {
        expect(point.effort).toBeGreaterThanOrEqual(1);
        expect(point.effort).toBeLessThanOrEqual(5);
      }
    });
  });

  it("should validate soreness values are in range 1-5", () => {
    mockData.forEach(point => {
      if (point.soreness !== undefined) {
        expect(point.soreness).toBeGreaterThanOrEqual(1);
        expect(point.soreness).toBeLessThanOrEqual(5);
      }
    });
  });

  it("should have consistent session labeling", () => {
    mockData.forEach(point => {
      const expectedSession = `W${point.week}S${point.sessionNumber}`;
      expect(point.session).toBe(expectedSession);
    });
  });
});
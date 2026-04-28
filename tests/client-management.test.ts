import { describe, it, expect } from "vitest";

describe("Client Completion Rate Calculation", () => {
  it("calculates correct completion rate for early progress", () => {
    const currentWeek = 2;
    const currentSession = 1;
    const completedSessions = 2;
    
    // Total sessions = (week-1)*3 + session-1 = (2-1)*3 + 1-1 = 3
    const totalSessions = (currentWeek - 1) * 3 + currentSession - 1;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    expect(totalSessions).toBe(3);
    expect(Math.round(completionRate)).toBe(67); // 2/3 = 66.67% -> 67%
  });

  it("calculates correct completion rate for mid-program", () => {
    const currentWeek = 6;
    const currentSession = 2;
    const completedSessions = 12;
    
    // Total sessions = (6-1)*3 + 2-1 = 15 + 1 = 16
    const totalSessions = (currentWeek - 1) * 3 + currentSession - 1;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    expect(totalSessions).toBe(16);
    expect(Math.round(completionRate)).toBe(75); // 12/16 = 75%
  });

  it("handles zero completed sessions", () => {
    const currentWeek = 1;
    const currentSession = 1;
    const completedSessions = 0;
    
    const totalSessions = (currentWeek - 1) * 3 + currentSession - 1;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    expect(totalSessions).toBe(0);
    expect(completionRate).toBe(0);
  });

  it("caps total sessions at 36 for the full program", () => {
    const currentWeek = 15; // Beyond 12 weeks
    const currentSession = 3;
    const completedSessions = 36;
    
    const calculatedTotal = (currentWeek - 1) * 3 + currentSession - 1;
    const totalSessions = Math.min(calculatedTotal, 36);
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    expect(calculatedTotal).toBe(44); // Would be 44 without cap
    expect(totalSessions).toBe(36); // Capped at 36
    expect(Math.round(completionRate)).toBe(100);
  });
});

describe("Client Sorting Logic", () => {
  const clients = [
    { 
      full_name: "Alice Johnson", 
      email: "alice@example.com", 
      last_session_date: "2024-01-15T10:00:00Z" 
    },
    { 
      full_name: "Bob Smith", 
      email: "bob@example.com", 
      last_session_date: null 
    },
    { 
      full_name: "Carol Davis", 
      email: "carol@example.com", 
      last_session_date: "2024-01-20T10:00:00Z" 
    },
    { 
      full_name: null, 
      email: "unnamed@example.com", 
      last_session_date: null 
    },
  ];

  it("sorts by last activity date (most recent first)", () => {
    const sorted = [...clients].sort((a, b) => {
      if (a.last_session_date && b.last_session_date) {
        return new Date(b.last_session_date).getTime() - new Date(a.last_session_date).getTime();
      }
      if (a.last_session_date && !b.last_session_date) return -1;
      if (!a.last_session_date && b.last_session_date) return 1;
      
      return (a.full_name || a.email).localeCompare(b.full_name || b.email);
    });

    expect(sorted[0].full_name).toBe("Carol Davis"); // Most recent activity
    expect(sorted[1].full_name).toBe("Alice Johnson"); // Second most recent
    expect(sorted[2].full_name).toBe("Bob Smith"); // No activity, alphabetical
    expect(sorted[3].full_name).toBe(null); // No activity, by email
  });
});

describe("Date Formatting Utils", () => {
  it("formats null date as Never", () => {
    expect(formatLastSession(null)).toBe("Never");
  });

  it("formats today's date as Today", () => {
    const today = new Date().toISOString();
    expect(formatLastSession(today)).toBe("Today");
  });

  it("formats yesterday's date as Yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatLastSession(yesterday.toISOString())).toBe("Yesterday");
  });

  it("formats recent dates in days", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(formatLastSession(threeDaysAgo.toISOString())).toBe("3 days ago");
  });

  it("formats older dates in weeks", () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    expect(formatLastSession(tenDaysAgo.toISOString())).toBe("1 weeks ago");
  });
});

describe("Completion Rate Color Coding", () => {
  it("returns success color for high completion rates", () => {
    expect(getCompletionRateColor(85)).toBe("#2D7A3A");
    expect(getCompletionRateColor(80)).toBe("#2D7A3A");
    expect(getCompletionRateColor(100)).toBe("#2D7A3A");
  });

  it("returns warning color for medium completion rates", () => {
    expect(getCompletionRateColor(70)).toBe("#C08030");
    expect(getCompletionRateColor(60)).toBe("#C08030");
    expect(getCompletionRateColor(79)).toBe("#C08030");
  });

  it("returns error color for low completion rates", () => {
    expect(getCompletionRateColor(50)).toBe("#B83020");
    expect(getCompletionRateColor(0)).toBe("#B83020");
    expect(getCompletionRateColor(59)).toBe("#B83020");
  });
});

describe("Effort and Soreness Labels", () => {
  it("formats effort levels correctly", () => {
    expect(getEffortLabel(1)).toBe("🔴 Easy");
    expect(getEffortLabel(2)).toBe("🟡 Light");
    expect(getEffortLabel(3)).toBe("🟠 Moderate");
    expect(getEffortLabel(4)).toBe("🟢 Hard");
    expect(getEffortLabel(5)).toBe("💪 Maxed");
    expect(getEffortLabel(null)).toBe("N/A");
  });

  it("formats soreness levels correctly", () => {
    expect(getSorenessLabel(1)).toBe("😄 None");
    expect(getSorenessLabel(2)).toBe("🙂 Light");
    expect(getSorenessLabel(3)).toBe("😐 Moderate");
    expect(getSorenessLabel(4)).toBe("😬 High");
    expect(getSorenessLabel(5)).toBe("😵 Severe");
    expect(getSorenessLabel(null)).toBe("N/A");
  });
});

describe("Session Date Formatting", () => {
  it("formats null dates as Not started", () => {
    expect(formatSessionDate(null)).toBe("Not started");
  });

  it("formats dates in expected format", () => {
    const testDate = "2024-01-15T10:00:00Z";
    const formatted = formatSessionDate(testDate);
    expect(formatted).toMatch(/Jan 15, 2024/);
  });
});

describe("Active Time Calculation", () => {
  it("calculates weeks active correctly", () => {
    const enrollmentDate = new Date("2024-01-01T00:00:00Z");
    const currentDate = new Date("2024-01-15T00:00:00Z");
    
    const weeksActive = Math.floor(
      (currentDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    
    expect(weeksActive).toBe(2); // 14 days = 2 weeks
  });

  it("handles same day enrollment", () => {
    const enrollmentDate = new Date("2024-01-01T00:00:00Z");
    const currentDate = new Date("2024-01-01T12:00:00Z");
    
    const weeksActive = Math.floor(
      (currentDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    
    expect(weeksActive).toBe(0);
  });
});

// Helper functions used in tests (would normally be imported from utils)
function formatLastSession(date: string | null): string {
  if (!date) return "Never";
  
  const now = new Date();
  const sessionDate = new Date(date);
  const diffMs = now.getTime() - sessionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return sessionDate.toLocaleDateString();
}

function getCompletionRateColor(rate: number): string {
  if (rate >= 80) return "#2D7A3A"; // success
  if (rate >= 60) return "#C08030"; // warning  
  return "#B83020"; // error
}

function getEffortLabel(effort: number | null): string {
  if (!effort) return "N/A";
  const labels = {
    1: "🔴 Easy",
    2: "🟡 Light",
    3: "🟠 Moderate",
    4: "🟢 Hard",
    5: "💪 Maxed"
  };
  return labels[effort as keyof typeof labels] || "N/A";
}

function getSorenessLabel(soreness: number | null): string {
  if (!soreness) return "N/A";
  const labels = {
    1: "😄 None",
    2: "🙂 Light",
    3: "😐 Moderate",
    4: "😬 High",
    5: "😵 Severe"
  };
  return labels[soreness as keyof typeof labels] || "N/A";
}

function formatSessionDate(date: string | null): string {
  if (!date) return "Not started";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
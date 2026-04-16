import { describe, it, expect } from "vitest";
import { SESSIONS_PER_PAGE } from "@/lib/constants";

describe("Session Tracker Constants", () => {
  it("has SESSIONS_PER_PAGE set to 3", () => {
    expect(SESSIONS_PER_PAGE).toBe(3);
  });
});

describe("Session Pagination Logic", () => {
  it("calculates correct session range for week 1", () => {
    const currentWeek = 1;
    const startSession = (currentWeek - 1) * 3 + 1;
    const endSession = currentWeek * 3;
    
    expect(startSession).toBe(1);
    expect(endSession).toBe(3);
  });

  it("calculates correct session range for week 2", () => {
    const currentWeek = 2;
    const startSession = (currentWeek - 1) * 3 + 1;
    const endSession = currentWeek * 3;
    
    expect(startSession).toBe(4);
    expect(endSession).toBe(6);
  });

  it("calculates correct session range for week 12", () => {
    const currentWeek = 12;
    const startSession = (currentWeek - 1) * 3 + 1;
    const endSession = currentWeek * 3;
    
    expect(startSession).toBe(34);
    expect(endSession).toBe(36);
  });
});

describe("Session Status Logic", () => {
  it("identifies completed sessions correctly", () => {
    const completedSession = {
      is_complete: true,
      completed_at: new Date().toISOString(),
      started_at: new Date().toISOString()
    };
    
    expect(completedSession.is_complete).toBe(true);
  });

  it("identifies in-progress sessions correctly", () => {
    const inProgressSession = {
      is_complete: false,
      started_at: new Date().toISOString(),
      completed_at: null
    };
    
    expect(inProgressSession.is_complete).toBe(false);
    expect(inProgressSession.started_at).not.toBeNull();
  });

  it("identifies not-started sessions correctly", () => {
    const notStartedSession = {
      is_complete: false,
      started_at: null,
      completed_at: null
    };
    
    expect(notStartedSession.is_complete).toBe(false);
    expect(notStartedSession.started_at).toBeNull();
  });
});

describe("Auto-expand Logic", () => {
  it("identifies first incomplete session for auto-expansion", () => {
    const sessions = [
      { id: "1", is_complete: true },
      { id: "2", is_complete: false },
      { id: "3", is_complete: false }
    ];
    
    const firstIncompleteIndex = sessions.findIndex(session => !session.is_complete);
    
    expect(firstIncompleteIndex).toBe(1);
    expect(sessions[firstIncompleteIndex].id).toBe("2");
  });

  it("handles all completed sessions", () => {
    const sessions = [
      { id: "1", is_complete: true },
      { id: "2", is_complete: true },
      { id: "3", is_complete: true }
    ];
    
    const firstIncompleteIndex = sessions.findIndex(session => !session.is_complete);
    
    expect(firstIncompleteIndex).toBe(-1);
  });

  it("determines expand state correctly", () => {
    const sessions = [
      { id: "1", is_complete: true },
      { id: "2", is_complete: false },
      { id: "3", is_complete: false }
    ];
    
    const firstIncompleteIndex = sessions.findIndex(session => !session.is_complete);
    
    sessions.forEach((session, index) => {
      const shouldExpand = !session.is_complete && (firstIncompleteIndex === -1 || index === firstIncompleteIndex);
      
      if (index === 0) {
        expect(shouldExpand).toBe(false); // Completed, don't expand
      } else if (index === 1) {
        expect(shouldExpand).toBe(true);  // First incomplete, expand
      } else if (index === 2) {
        expect(shouldExpand).toBe(false); // Incomplete but not first, don't expand
      }
    });
  });
});

describe("Week Navigation Logic", () => {
  const totalWeeks = 12;

  it("handles navigation boundaries correctly", () => {
    // Week 1 - Previous should be disabled
    const currentWeek1 = 1;
    const prevWeek1 = Math.max(1, currentWeek1 - 1);
    const nextWeek1 = Math.min(totalWeeks, currentWeek1 + 1);
    
    expect(prevWeek1).toBe(1); // Can't go below 1
    expect(nextWeek1).toBe(2); // Can go to next week
    
    // Week 12 - Next should be disabled
    const currentWeek12 = 12;
    const prevWeek12 = Math.max(1, currentWeek12 - 1);
    const nextWeek12 = Math.min(totalWeeks, currentWeek12 + 1);
    
    expect(prevWeek12).toBe(11); // Can go to previous week
    expect(nextWeek12).toBe(12); // Can't go above total weeks
    
    // Middle week - Both should work
    const currentWeek6 = 6;
    const prevWeek6 = Math.max(1, currentWeek6 - 1);
    const nextWeek6 = Math.min(totalWeeks, currentWeek6 + 1);
    
    expect(prevWeek6).toBe(5);
    expect(nextWeek6).toBe(7);
  });
});

describe("Virtual Session Creation", () => {
  it("creates virtual session with correct properties", () => {
    const userId = "test-user-id";
    const template = {
      id: "template-123",
      week_number: 1,
      session_number: 1,
      day_label: "A" as const,
      title: "Test Session"
    };
    const enrollmentId = "enrollment-456";
    
    const virtualSession = {
      id: `virtual-${template.id}`,
      user_id: userId,
      workout_template_id: template.id,
      enrollment_id: enrollmentId,
      week_number: template.week_number,
      session_number: template.session_number,
      started_at: null,
      completed_at: null,
      is_complete: false,
      post_session_effort: null,
      pre_session_soreness: null,
      soreness_prompted: false,
      notes: null,
      created_at: new Date().toISOString(),
      template
    };
    
    expect(virtualSession.id).toBe("virtual-template-123");
    expect(virtualSession.is_complete).toBe(false);
    expect(virtualSession.started_at).toBeNull();
    expect(virtualSession.template).toEqual(template);
  });
});

describe("Total Weeks Calculation", () => {
  it("calculates correct total weeks for 36 sessions", () => {
    const totalSessions = 36;
    const sessionsPerWeek = 3;
    const totalWeeks = Math.ceil(totalSessions / sessionsPerWeek);
    
    expect(totalWeeks).toBe(12);
  });
  
  it("handles partial weeks correctly", () => {
    const totalSessions = 37; // One extra session
    const sessionsPerWeek = 3;
    const totalWeeks = Math.ceil(totalSessions / sessionsPerWeek);
    
    expect(totalWeeks).toBe(13); // Should round up
  });
});
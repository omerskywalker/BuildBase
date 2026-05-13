import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

type ItemStatus = "not-started" | "in-progress" | "done" | "paused" | "failed";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: ItemStatus;
  tests: boolean;
  branch?: string;
  pr?: number;
  issue?: number;
}

interface RoadmapBatch {
  number: number;
  title: string;
  summary: string;
  parallelizable: boolean;
  items: RoadmapItem[];
}

// Inline roadmap data so the monitor page is self-contained and always current
const ROADMAP: RoadmapBatch[] = [
  {
    number: 1, title: "Stop Lying to Users", summary: "Fix critical bugs that silently lose workout data and show false success messages.", parallelizable: false,
    items: [
      { id: "1-1", title: "Fix quick-log persistence — NOT NULL constraint", description: "session_logs.week_number and session_number are NOT NULL but quick-log sends neither.", status: "not-started", tests: true, branch: "fix/quick-log-persistence", issue: 97 },
      { id: "1-2", title: "Fix QuickLogModal false success on save failure", description: "Catch block sets setSaved(true) even on failure.", status: "not-started", tests: true, branch: "fix/quick-log-false-success", issue: 98 },
      { id: "1-3", title: "Add apiFetchJson wrapper", description: "Surface API failures as toasts instead of silence.", status: "not-started", tests: true, branch: "fix/api-error-handling", issue: 99 },
    ],
  },
  {
    number: 2, title: "Backend Hardening", summary: "Stop leaking errors, validate inputs, lock down CORS, use the logger.", parallelizable: true,
    items: [
      { id: "2-1", title: "Stop leaking DB error messages", description: "sessions.ts returns raw error.message from Supabase.", status: "not-started", tests: true, branch: "fix/sanitize-error-responses", issue: 100 },
      { id: "2-2", title: "Verify update row counts", description: "Silent no-ops on session mutations.", status: "not-started", tests: true, branch: "fix/verify-update-row-counts", issue: 101 },
      { id: "2-3", title: "JSON body size limit + CORS lockdown", description: "No size limit, CORS allows all origins.", status: "not-started", tests: true, branch: "fix/request-limits-cors", issue: 102 },
      { id: "2-4", title: "Use logger in all route files", description: "Logger exists but is never imported.", status: "not-started", tests: false, branch: "fix/add-server-logging", issue: 115 },
      { id: "2-5", title: "RLS INSERT policy for form assessments", description: "Missing INSERT WITH CHECK policy.", status: "not-started", tests: false, branch: "fix/form-assessment-rls", issue: 120 },
    ],
  },
  {
    number: 3, title: "Data Quality & Resilience", summary: "Input validation, seed data fixes, transaction safety, error boundaries.", parallelizable: true,
    items: [
      { id: "3-1", title: "Input validation on admin routes", description: "No length/range/URL validation.", status: "not-started", tests: true, branch: "fix/input-validation", issue: 103 },
      { id: "3-2", title: "Fix seed data weights", description: "Female post-baseline weights are 0, plank reps are 0.", status: "not-started", tests: false, branch: "fix/seed-data-weights", issue: 117 },
      { id: "3-3", title: "Exercise reorder transaction safety", description: "Promise.all without rollback.", status: "not-started", tests: true, branch: "fix/exercise-reorder-transaction", issue: 116 },
      { id: "3-4", title: "Error boundaries in React", description: "No error boundaries — white screen on crash.", status: "not-started", tests: true, branch: "feat/error-boundaries", issue: 119 },
    ],
  },
  {
    number: 4, title: "Core Loop Features", summary: "Enrollment UI, onboarding flow, playbook, session history, exercise videos.", parallelizable: true,
    items: [
      { id: "4-1", title: "Program enrollment UI", description: "Assign Program button on admin user detail.", status: "not-started", tests: true, branch: "feat/program-enrollment-ui", issue: 106 },
      { id: "4-2", title: "Post-onboarding enrollment flow", description: "Auto-enroll or prompt after onboarding.", status: "not-started", tests: true, branch: "feat/post-onboarding-enrollment", issue: 107 },
      { id: "4-3", title: "Database-backed playbook", description: "Replace hardcoded PLAYBOOK constant.", status: "not-started", tests: true, branch: "feat/playbook-database", issue: 108 },
      { id: "4-4", title: "Session history view", description: "Browse past workouts with sets/reps/weight.", status: "not-started", tests: true, branch: "feat/session-history", issue: 110 },
      { id: "4-5", title: "Exercise video/demo links", description: "Render video_url in session cards.", status: "not-started", tests: true, branch: "feat/exercise-video-links", issue: 109 },
    ],
  },
  {
    number: 5, title: "Code Cleanup", summary: "Decompose oversized components, remove unused packages, add indexes.", parallelizable: true,
    items: [
      { id: "5-1", title: "Decompose QuickLogModal", description: "613 lines → 7 focused files.", status: "not-started", tests: true, branch: "refactor/quick-log-decompose", issue: 104 },
      { id: "5-2", title: "Remove unused Drizzle/generated client", description: "Empty schema, unused packages.", status: "not-started", tests: false, branch: "cleanup/drizzle-decision", issue: 118 },
      { id: "5-3", title: "Add database indexes", description: "Missing FK and compound indexes.", status: "not-started", tests: false, branch: "perf/add-database-indexes", issue: 105 },
    ],
  },
  {
    number: 6, title: "Platform Feel", summary: "Email notifications, admin analytics, CI/CD, Stripe.", parallelizable: true,
    items: [
      { id: "6-1", title: "Coach note email notifications", description: "Email on coach_notes INSERT.", status: "not-started", tests: true, branch: "feat/coach-note-emails", issue: 111 },
      { id: "6-2", title: "Admin analytics dashboard", description: "Active athletes, completion rates, coach workload.", status: "not-started", tests: true, branch: "feat/admin-analytics", issue: 112 },
      { id: "6-3", title: "CI/CD pipeline", description: "Typecheck on push, auto-deploy.", status: "not-started", tests: false, branch: "infra/ci-cd-pipeline", issue: 113 },
      { id: "6-4", title: "Stripe payments", description: "Subscription billing.", status: "not-started", tests: true, branch: "feat/stripe-payments", issue: 114 },
    ],
  },
];

const REPO = "omerskywalker/BuildBase";

const STATUS_COLORS: Record<ItemStatus, string> = {
  "not-started": "#988A78",
  "in-progress": "#C08030",
  done: "#2D7A3A",
  paused: "#6B5A48",
  failed: "#B83020",
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  done: "Done",
  paused: "Paused",
  failed: "Failed",
};

interface GitHubData {
  prs: any[];
  issues: any[];
  checks: Record<number, string>;
}

export default function RoadmapMonitor() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [ghData, setGhData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(false);
  const [kickingOff, setKickingOff] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!pin) return;
    try {
      const res = await fetch(`/api/monitor/roadmap?pin=${pin}`);
      if (res.ok) {
        setGhData(await res.json());
      }
    } catch {
      // silent — poll will retry
    }
  }, [pin]);

  useEffect(() => {
    if (!authed) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [authed, fetchStatus]);

  const handleLogin = () => {
    setPin(pinInput);
    setAuthed(true);
  };

  const getLiveStatus = (item: RoadmapItem): ItemStatus => {
    if (!ghData || !item.pr) return item.status;
    const pr = ghData.prs.find((p: any) => p.number === item.pr);
    if (!pr) return item.status;
    if (pr.merged_at) return "done";
    if (pr.state === "closed") return "failed";
    const check = ghData.checks[item.pr];
    if (check === "failure") return "failed";
    if (check === "in_progress" || check === "pending") return "in-progress";
    if (pr.state === "open") return "in-progress";
    return item.status;
  };

  const kickoff = async (item: RoadmapItem) => {
    setKickingOff(item.id);
    try {
      const res = await fetch("/api/monitor/kickoff", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-roadmap-pin": pin },
        body: JSON.stringify({
          itemId: item.id,
          title: item.title,
          description: item.description,
          branch: item.branch,
          issueNumber: item.issue,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Started ${item.id}: ${item.title}`, {
          description: data.pr ? `PR #${data.pr} created` : "Workflow dispatched",
        });
        fetchStatus();
      } else {
        toast.error(`Failed to start ${item.id}`, { description: data.error });
      }
    } catch {
      toast.error(`Failed to start ${item.id}`);
    } finally {
      setKickingOff(null);
    }
  };

  const kickoffBatch = async (batch: RoadmapBatch) => {
    const notStarted = batch.items.filter((i) => getLiveStatus(i) === "not-started");
    if (notStarted.length === 0) {
      toast.info("No items to start in this batch");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/monitor/kickoff-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-roadmap-pin": pin },
        body: JSON.stringify({
          items: notStarted.map((i) => ({
            itemId: i.id,
            title: i.title,
            description: i.description,
            branch: i.branch,
            issueNumber: i.issue,
          })),
        }),
      });
      const data = await res.json();
      toast.success(`Dispatched ${data.succeeded?.length ?? 0} items`, {
        description: data.failed?.length ? `${data.failed.length} failed` : undefined,
      });
      fetchStatus();
    } catch {
      toast.error("Batch kickoff failed");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div style={{ background: "#EDE4D3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#E8DECE", border: "1px solid #C8B99D", borderRadius: 12, padding: 32, width: 360, textAlign: "center" }}>
          <h1 style={{ color: "#2C1A10", fontSize: 24, marginBottom: 8 }}>
            <span style={{ color: "#1C3A2A" }}>Build</span>
            <span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
            {" "}Monitor
          </h1>
          <p style={{ color: "#6B5A48", marginBottom: 24 }}>Enter PIN to access the roadmap</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="PIN"
            style={{
              width: "100%", padding: "10px 16px", border: "1px solid #C8B99D", borderRadius: 8,
              background: "#FAF6F0", color: "#2C1A10", fontSize: 16, marginBottom: 16, outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "10px 16px", background: "#C84B1A", color: "#FEFCF8",
              border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer",
            }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  const allItems = ROADMAP.flatMap((b) => b.items);
  const doneCount = allItems.filter((i) => getLiveStatus(i) === "done").length;
  const pct = Math.round((doneCount / allItems.length) * 100);

  return (
    <div style={{ background: "#EDE4D3", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#2C1A10", fontSize: 28, marginBottom: 4 }}>
            <span style={{ color: "#1C3A2A" }}>Build</span>
            <span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
            {" "}Roadmap V2
          </h1>
          <p style={{ color: "#6B5A48", margin: 0 }}>
            {doneCount}/{allItems.length} items complete ({pct}%)
          </p>
          {/* Progress bar */}
          <div style={{ marginTop: 12, height: 8, background: "#DDD2BF", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#2D7A3A", borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Batches */}
        {ROADMAP.map((batch) => {
          const batchDone = batch.items.filter((i) => getLiveStatus(i) === "done").length;
          const batchPct = Math.round((batchDone / batch.items.length) * 100);
          const allDone = batchDone === batch.items.length;
          const hasNotStarted = batch.items.some((i) => getLiveStatus(i) === "not-started");

          return (
            <div key={batch.number} style={{
              background: "#E8DECE", border: "1px solid #C8B99D", borderRadius: 12,
              padding: 24, marginBottom: 20,
            }}>
              {/* Batch header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h2 style={{ color: "#2C1A10", fontSize: 18, margin: 0 }}>
                    Phase {batch.number}: {batch.title}
                    {allDone && " ✓"}
                  </h2>
                  <p style={{ color: "#6B5A48", fontSize: 14, margin: "4px 0 0" }}>{batch.summary}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "#988A78" }}>{batchDone}/{batch.items.length} ({batchPct}%)</span>
                    {batch.parallelizable && (
                      <span style={{ fontSize: 11, color: "#1C3A2A", background: "#1C3A2A18", padding: "2px 8px", borderRadius: 4 }}>
                        Parallelizable
                      </span>
                    )}
                  </div>
                </div>
                {batch.parallelizable && hasNotStarted && (
                  <button
                    onClick={() => kickoffBatch(batch)}
                    disabled={loading}
                    style={{
                      padding: "6px 16px", background: "#1C3A2A", color: "#FEFCF8",
                      border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Start All
                  </button>
                )}
              </div>

              {/* Batch progress bar */}
              <div style={{ height: 4, background: "#DDD2BF", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${batchPct}%`, background: "#2D7A3A", borderRadius: 2, transition: "width 0.3s" }} />
              </div>

              {/* Items */}
              {batch.items.map((item) => {
                const liveStatus = getLiveStatus(item);
                const isKicking = kickingOff === item.id;

                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", background: "#FAF6F0", border: "1px solid #DDD2BF",
                    borderRadius: 8, marginBottom: 8,
                  }}>
                    {/* Status badge */}
                    <span style={{
                      display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                      background: STATUS_COLORS[liveStatus], flexShrink: 0,
                      animation: liveStatus === "in-progress" ? "pulse 2s infinite" : undefined,
                    }} />

                    {/* Item info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#988A78", fontSize: 13, fontWeight: 600 }}>{item.id}</span>
                        <span style={{ color: "#2C1A10", fontSize: 14, fontWeight: 500 }}>{item.title}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span style={{
                          fontSize: 11, color: STATUS_COLORS[liveStatus],
                          background: `${STATUS_COLORS[liveStatus]}18`, padding: "1px 6px", borderRadius: 3,
                        }}>
                          {STATUS_LABELS[liveStatus]}
                        </span>
                        {item.issue && (
                          <a
                            href={`https://github.com/${REPO}/issues/${item.issue}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, color: "#6B5A48", textDecoration: "none" }}
                          >
                            #{item.issue}
                          </a>
                        )}
                        {item.pr && (
                          <a
                            href={`https://github.com/${REPO}/pull/${item.pr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, color: "#6B5A48", textDecoration: "none" }}
                          >
                            PR #{item.pr}
                          </a>
                        )}
                        {item.tests && <span style={{ fontSize: 11, color: "#988A78" }}>tests required</span>}
                      </div>
                    </div>

                    {/* Action button */}
                    {liveStatus === "not-started" && (
                      <button
                        onClick={() => kickoff(item)}
                        disabled={isKicking}
                        style={{
                          padding: "5px 14px", background: "#C84B1A", color: "#FEFCF8",
                          border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
                          cursor: isKicking ? "wait" : "pointer", opacity: isKicking ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isKicking ? "Starting..." : "Start"}
                      </button>
                    )}
                    {liveStatus === "failed" && (
                      <button
                        onClick={() => kickoff(item)}
                        disabled={isKicking}
                        style={{
                          padding: "5px 14px", background: "#B83020", color: "#FEFCF8",
                          border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
                          cursor: isKicking ? "wait" : "pointer", opacity: isKicking ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isKicking ? "Retrying..." : "Retry"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  );
}

import { ROADMAP, REPO, getBatchProgress, getOverallProgress, type RoadmapItem, type ItemStatus } from "@/lib/roadmap-data";
import { KickoffButton } from "./KickoffButton";
import { BatchKickoffButton } from "./BatchKickoffButton";
import { InProgressBadge } from "./InProgressBadge";
import { RoadmapPoller } from "./RoadmapPoller";
import { RetryButton } from "./RetryButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface GhPr {
  state: "open" | "closed";
  merged_at: string | null;
  html_url: string;
  head: { ref: string };
}

interface CiStatus {
  conclusion: "success" | "failure" | "pending" | null;
}

async function fetchPrStatus(pr: number): Promise<{ pr: GhPr; ci: CiStatus } | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;

    const prRes = await fetch(`https://api.github.com/repos/${REPO}/pulls/${pr}`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!prRes.ok) return null;

    const prData = await prRes.json() as GhPr;

    const checksRes = await fetch(
      `https://api.github.com/repos/${REPO}/commits/${prData.head?.ref}/check-runs`,
      { headers, next: { revalidate: 60 } }
    );
    let ci: CiStatus = { conclusion: null };
    if (checksRes.ok) {
      const checksData = await checksRes.json() as { check_runs: Array<{ conclusion: string | null }> };
      const runs = checksData.check_runs ?? [];
      const failed = runs.some((r) => r.conclusion === "failure");
      const pending = runs.some((r) => r.conclusion === null || r.conclusion === "in_progress");
      ci = { conclusion: failed ? "failure" : pending ? "pending" : runs.length > 0 ? "success" : null };
    }
    return { pr: prData, ci };
  } catch {
    return null;
  }
}

async function fetchAllPrStatuses() {
  const allItems = ROADMAP.flatMap((b) => b.items);
  const itemsWithPr = allItems.filter((i) => i.pr != null);
  const results = await Promise.all(
    itemsWithPr.map(async (item) => ({ id: item.id, data: await fetchPrStatus(item.pr!) }))
  );
  return Object.fromEntries(results.map((r) => [r.id, r.data]));
}

function statusLabel(status: ItemStatus) {
  switch (status) {
    case "done":         return "✅ Done";
    case "in-progress":  return "🔄 In Progress";
    case "paused":       return "⏸️ Paused";
    default:             return "🔲 Not Started";
  }
}

function statusColor(status: ItemStatus) {
  switch (status) {
    case "done":        return "#2D7A3A";
    case "in-progress": return "#3060A0";
    case "paused":      return "#8A9E8A";
    default:            return "#2A3D30";
  }
}

function ciDot(conclusion: CiStatus["conclusion"]) {
  if (conclusion === "success") return { color: "#2D7A3A", label: "CI ✓" };
  if (conclusion === "failure") return { color: "#B83020", label: "CI ✗" };
  if (conclusion === "pending") return { color: "#C08030", label: "CI …" };
  return null;
}

function ProgressBar({ pct, color = "#C84B1A" }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 4, background: "#2A3D30", borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s" }} />
    </div>
  );
}

function ItemRow({ item, prData }: { item: RoadmapItem; prData: Awaited<ReturnType<typeof fetchPrStatus>> }) {
  const dot = prData ? ciDot(prData.ci.conclusion) : null;
  const isMerged = prData?.pr?.merged_at != null;
  const effectiveStatus: ItemStatus = isMerged ? "done" : item.status;

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #1C2A20", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 11, color: "#4A5A4A", minWidth: 32, paddingTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
          {item.id}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: effectiveStatus === "done" ? "#4A5A4A" : "#E8F0E8",
            textDecoration: effectiveStatus === "done" ? "line-through" : "none",
            lineHeight: 1.4,
          }}>
            {item.title}
          </span>
          <p style={{ fontSize: 11, color: "#4A5A4A", marginTop: 3, lineHeight: 1.5 }}>{item.description}</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingLeft: 42 }}>
        {effectiveStatus === "in-progress" ? (
          <InProgressBadge />
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: statusColor(effectiveStatus),
            background: `${statusColor(effectiveStatus)}18`,
            border: `1px solid ${statusColor(effectiveStatus)}40`,
            borderRadius: 6, padding: "2px 8px",
          }}>
            {statusLabel(effectiveStatus)}
          </span>
        )}

        <KickoffButton itemId={item.id} disabled={effectiveStatus !== "not-started"} />
        {effectiveStatus === "in-progress" && prData?.ci.conclusion === "failure" && (
          <RetryButton itemId={item.id} />
        )}

        {item.issue && (
          <a href={`https://github.com/${REPO}/issues/${item.issue}`} target="_blank" rel="noopener"
            style={{ fontSize: 11, color: "#8A9E8A", textDecoration: "none", background: "rgba(138,158,138,0.08)", border: "1px solid rgba(138,158,138,0.2)", borderRadius: 6, padding: "2px 8px" }}>
            #{item.issue}
          </a>
        )}
        {item.pr && (
          <a href={`https://github.com/${REPO}/pull/${item.pr}`} target="_blank" rel="noopener"
            style={{ fontSize: 11, color: "#3060A0", textDecoration: "none", background: "rgba(48,96,160,0.08)", border: "1px solid rgba(48,96,160,0.2)", borderRadius: 6, padding: "2px 8px" }}>
            PR #{item.pr}
          </a>
        )}
        {dot && <span style={{ fontSize: 11, fontWeight: 600, color: dot.color }}>{dot.label}</span>}
        {item.tests && <span style={{ fontSize: 11, color: "#2D7A3A" }}>🧪 Tests</span>}
        {item.branch && (
          <span style={{ fontSize: 10, color: "#4A5A4A", background: "#152019", border: "1px solid #2A3D30", borderRadius: 4, padding: "2px 6px", fontFamily: "var(--font-mono, monospace)" }}>
            {item.branch}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function RoadmapMonitorPage() {
  const prStatuses = await fetchAllPrStatuses();
  const overall = getOverallProgress();

  const allItems = ROADMAP.flatMap((b) => b.items);
  const inProgressIds = allItems
    .filter((item) => {
      const isMerged = prStatuses[item.id]?.pr?.merged_at != null;
      return (isMerged ? "done" : item.status) === "in-progress";
    })
    .map((item) => item.id);
  const doneIds = allItems
    .filter((item) => {
      const isMerged = prStatuses[item.id]?.pr?.merged_at != null;
      return (isMerged ? "done" : item.status) === "done";
    })
    .map((item) => item.id);

  return (
    <div style={{ minHeight: "100dvh", background: "#0F1A14", color: "#E8F0E8", fontFamily: "var(--font-inter, sans-serif)", paddingBottom: 48 }}>
      <RoadmapPoller inProgressIds={inProgressIds} doneIds={doneIds} />

      <div style={{ background: "#152019", borderBottom: "1px solid #2A3D30", padding: "16px 16px 14px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: "#E8F0E8", fontFamily: "var(--font-space-grotesk, sans-serif)", marginBottom: 2 }}>
                <span style={{ color: "#1C3A2A" }}>Build</span><span style={{ color: "#C84B1A" }}>Base</span>
                <span style={{ color: "#4A5A4A", fontWeight: 400, fontSize: 13 }}> — Roadmap</span>
              </h1>
              <p style={{ fontSize: 12, color: "#4A5A4A" }}>
                {overall.done} / {overall.total} items complete · {overall.pct}%
              </p>
            </div>
            <div style={{ minWidth: 80 }}>
              <ProgressBar pct={overall.pct} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
        {ROADMAP.map((batch) => {
          const { total, done, inProgress } = getBatchProgress(batch);
          const batchPct = Math.round((done / total) * 100);
          const notStartedCount = batch.items.filter((i) => i.status === "not-started").length;
          const allDone = done === total;
          return (
            <div key={batch.number} style={{ marginTop: 24, background: "#152019", border: "1px solid #2A3D30", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #2A3D30", background: "#0F1A14" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#C84B1A", background: "rgba(200,75,26,0.1)", border: "1px solid rgba(200,75,26,0.2)", borderRadius: 6, padding: "2px 8px" }}>
                      Batch {batch.number}
                    </span>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E8F0E8", fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
                      {batch.title}
                    </h2>
                    <BatchKickoffButton
                      batchNumber={batch.number}
                      itemCount={notStartedCount}
                      parallelizable={batch.parallelizable}
                      allDone={allDone}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "#4A5A4A", whiteSpace: "nowrap" }}>
                    {done}/{total}
                    {inProgress > 0 && <span style={{ color: "#3060A0" }}> · {inProgress} active</span>}
                  </span>
                </div>
                <ProgressBar pct={batchPct} color={done === total ? "#2D7A3A" : "#C84B1A"} />
                <p style={{ fontSize: 12, color: "#4A5A4A", marginTop: 8, lineHeight: 1.5 }}>{batch.summary}</p>
              </div>
              <div style={{ padding: "0 16px" }}>
                {batch.items.map((item) => (
                  <ItemRow key={item.id} item={item} prData={prStatuses[item.id] ?? null} />
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 32, padding: "16px 0", borderTop: "1px solid #2A3D30" }}>
          <p style={{ fontSize: 11, color: "#2A3D30" }}>Status synced from GitHub · refreshes on each page load</p>
        </div>
      </div>
    </div>
  );
}

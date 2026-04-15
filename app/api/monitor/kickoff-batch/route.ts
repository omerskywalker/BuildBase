import { NextResponse } from "next/server";
import { ROADMAP, REPO } from "@/lib/roadmap-data";
import { getRoadmapOverrides, setRoadmapOverride } from "@/lib/storage";
import { getMainSha, ensureBranchReady, createDraftPr, createIssue } from "@/lib/github-api";
import { MONITOR_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  // Verify monitor session
  const cookie = request.headers.get("cookie") ?? "";
  if (!cookie.includes(`${MONITOR_COOKIE}=1`)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { batchNumber?: number };
  const { batchNumber } = body;

  if (!batchNumber) {
    return NextResponse.json({ success: false, error: "batchNumber required" }, { status: 400 });
  }

  const batch = ROADMAP.find((b) => b.number === batchNumber);
  if (!batch) {
    return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });
  }

  if (!batch.parallelizable) {
    return NextResponse.json(
      { success: false, error: "This batch must be run sequentially — use individual Start buttons" },
      { status: 400 }
    );
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ success: false, error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const itemsToKickoff = batch.items.filter((i) => i.status === "not-started");
  if (itemsToKickoff.length === 0) {
    return NextResponse.json({ success: false, error: "No not-started items in this batch" }, { status: 400 });
  }

  // Fetch once — reused across all parallel kickoffs
  const [mainSha, existingOverrides] = await Promise.all([
    getMainSha(token, REPO),
    getRoadmapOverrides(),
  ]);

  const results = await Promise.all(
    itemsToKickoff.map(async (item) => {
      const branchName = item.branch ?? `feat/item-${item.id}`;
      const existing = existingOverrides[item.id];

      const scopeLines = item.scope
        ? [
            `FILE SCOPE CONTRACT (parallel agent — do NOT violate):`,
            `  Owns (create/edit freely): ${item.scope.owns.join(", ")}`,
            `  Avoid (owned by sibling agents): ${item.scope.avoid.join(", ")}`,
            `  CRITICAL: Do NOT modify lib/roadmap-data.ts — the kickoff system manages status.`,
          ].join("\n")
        : `CRITICAL: Do NOT modify lib/roadmap-data.ts — the kickoff system manages status.`;

      // Issue — reuse if already exists
      const existingIssue = item.issue ?? existing?.issue ?? null;
      const issueNumber = existingIssue ?? await createIssue(token, REPO, item);

      // Branch + initial commit
      if (mainSha) {
        const branchReady = await ensureBranchReady(token, REPO, branchName, mainSha, item.id, item.title);
        if (!branchReady) {
          console.error(`[kickoff-batch] ensureBranchReady failed for ${branchName}`);
          return { itemId: item.id, success: false, error: "Failed to prepare branch — check GITHUB_TOKEN permissions" };
        }
      }

      // Draft PR — reuse if already exists
      const pr = await createDraftPr(token, REPO, branchName, item, issueNumber);
      const prNumber = pr?.number ?? existing?.pr ?? null;

      // KV override
      await setRoadmapOverride(item.id, {
        status: "in-progress",
        pr: prNumber ?? undefined,
        issue: issueNumber ?? undefined,
        startedAt: existing?.startedAt ?? new Date().toISOString(),
      });

      // Workflow dispatch
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/actions/workflows/claude-feature.yml/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: {
              item_id: item.id,
              item_title: item.title,
              item_description: `${item.description}\n\n${scopeLines}`,
              branch_name: branchName,
              issue_number: issueNumber != null ? String(issueNumber) : "",
              pr_number: prNumber != null ? String(prNumber) : "",
              retry: "false",
            },
          }),
        }
      );

      if (!res.ok && res.status !== 204) {
        const text = await res.text();
        console.error(`[kickoff-batch] dispatch failed for ${item.id}:`, res.status, text);
        return { itemId: item.id, success: false, error: `GitHub dispatch failed: ${res.status}` };
      }

      return { itemId: item.id, success: true };
    })
  );

  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    return NextResponse.json({
      success: false,
      dispatched: results.filter((r) => r.success).map((r) => r.itemId),
      failed: failures.map((r) => ({ itemId: r.itemId, error: r.error })),
    }, { status: 207 });
  }

  return NextResponse.json({
    success: true,
    dispatched: results.map((r) => r.itemId),
    count: results.length,
  });
}

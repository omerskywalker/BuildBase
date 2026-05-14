import { NextResponse } from "next/server";
import { ROADMAP, REPO } from "@/lib/roadmap-data";
import { getRoadmapOverrides, setRoadmapOverride } from "@/lib/storage";
import { getMainSha, ensureBranchReady, createDraftPr } from "@/lib/github-api";
import { MONITOR_COOKIE } from "@/lib/constants";
import { verifySession } from "@/lib/monitor-auth";

export async function POST(request: Request) {
  // Verify the signed session cookie — not just its presence
  const cookies = Object.fromEntries(
    (request.headers.get("cookie") ?? "").split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const sessionToken = cookies[MONITOR_COOKIE] ?? "";
  if (!verifySession(sessionToken, process.env.ROADMAP_PIN ?? "")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { itemId?: string; retry?: boolean };
  const { itemId, retry } = body;

  if (!itemId) {
    return NextResponse.json({ success: false, error: "itemId required" }, { status: 400 });
  }

  const allItems = ROADMAP.flatMap((b) => b.items);
  const item = allItems.find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ success: false, error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const branchName = item.branch ?? `feat/item-${itemId}`;

  // Check KV for an existing in-progress record so we don't duplicate issues/PRs on retry
  const existingOverrides = await getRoadmapOverrides();
  const existing = existingOverrides[itemId];

  // 1. Issue — all items have issue numbers stamped in roadmap-data.ts; creation is disabled.
  // KV is checked as a fallback for any item whose issue was set at kickoff time before the stamp.
  const issueNumber = item.issue ?? existing?.issue ?? null;

  // 2. Branch + initial commit — ensures PR creation won't fail with "no commits between branches"
  const mainSha = await getMainSha(token, REPO);
  if (mainSha) {
    const branchReady = await ensureBranchReady(token, REPO, branchName, mainSha, itemId, item.title);
    if (!branchReady) {
      console.error(`[kickoff] ensureBranchReady failed for ${branchName}`);
      return NextResponse.json(
        { success: false, error: "Failed to prepare branch — check GITHUB_TOKEN permissions" },
        { status: 502 }
      );
    }
  }

  // 3. Draft PR — reuses existing if one is already open for this branch
  const pr = await createDraftPr(token, REPO, branchName, item, issueNumber);
  const prNumber = pr?.number ?? existing?.pr ?? null;
  const prUrl = pr?.html_url ?? null;

  // 4. KV override — flips UI to in-progress immediately
  await setRoadmapOverride(itemId, {
    status: "in-progress",
    pr: prNumber ?? undefined,
    issue: issueNumber ?? undefined,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
  });

  // 5. Workflow dispatch
  const dispatchRes = await fetch(
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
          item_id: itemId,
          item_title: item.title,
          item_description: item.description,
          branch_name: branchName,
          issue_number: issueNumber != null ? String(issueNumber) : "",
          pr_number: prNumber != null ? String(prNumber) : "",
          retry: retry ? "true" : "false",
        },
      }),
    }
  );

  if (!dispatchRes.ok && dispatchRes.status !== 204) {
    const text = await dispatchRes.text();
    console.error("[kickoff] dispatch failed:", dispatchRes.status, text);
    return NextResponse.json(
      { success: false, error: `GitHub dispatch failed: ${dispatchRes.status}` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    issueNumber,
    issueUrl: issueNumber != null ? `https://github.com/${REPO}/issues/${issueNumber}` : null,
    prNumber,
    prUrl,
  });
}

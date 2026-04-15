import { NextResponse } from "next/server";
import { ROADMAP, REPO } from "@/lib/roadmap-data";
import { setRoadmapOverride } from "@/lib/storage";
import { MONITOR_COOKIE } from "@/lib/constants";

const GH_API = "https://api.github.com";

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/** Creates a GitHub Issue for a roadmap item. Returns the issue number, or null on failure. */
async function createIssue(
  token: string,
  item: { id: string; title: string; description: string; branch?: string; scope?: { owns: string[]; avoid: string[] } }
): Promise<number | null> {
  const scopeSection = item.scope
    ? `\n### File Scope\n- **Owns:** ${item.scope.owns.map((p) => `\`${p}\``).join(", ")}\n- **Avoid:** ${item.scope.avoid.map((p) => `\`${p}\``).join(", ")}`
    : "";

  const body = [
    `## BuildBase Roadmap Item \`${item.id}\``,
    "",
    `**${item.title}**`,
    "",
    item.description,
    "",
    "---",
    "",
    "### Implementation Notes",
    `- Branch: \`${item.branch ?? `feat/item-${item.id}`}\``,
    scopeSection,
    "",
    "### Agent References",
    `- [\`CLAUDE.md\`](https://github.com/${REPO}/blob/main/CLAUDE.md) — project conventions, architecture, design tokens`,
    `- [\`WIKI/index.md\`](https://github.com/${REPO}/blob/main/WIKI/index.md) — current status, file map`,
    `- [\`WIKI/gotchas.md\`](https://github.com/${REPO}/blob/main/WIKI/gotchas.md) — known pitfalls, read first`,
    "",
    "---",
    "*Opened automatically by the BuildBase roadmap monitor at kickoff.*",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const res = await fetch(`${GH_API}/repos/${REPO}/issues`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ title: `[${item.id}] ${item.title}`, body }),
  });

  if (!res.ok) {
    console.error("Failed to create issue:", res.status, await res.text());
    return null;
  }

  const data = await res.json() as { number: number };
  return data.number;
}

/** Gets the SHA of the default branch (main). */
async function getMainSha(token: string): Promise<string | null> {
  const res = await fetch(`${GH_API}/repos/${REPO}/git/ref/heads/main`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json() as { object: { sha: string } };
  return data.object?.sha ?? null;
}

/** Creates a branch from the given SHA. Returns true on success (or if branch already exists). */
async function createBranch(token: string, branchName: string, sha: string): Promise<boolean> {
  const res = await fetch(`${GH_API}/repos/${REPO}/git/refs`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  });
  if (res.status === 422) {
    // Branch already exists — that's fine (e.g. retry scenario)
    return true;
  }
  return res.ok;
}

/** Creates a draft PR. Returns { number, html_url } or null on failure. */
async function createDraftPr(
  token: string,
  branchName: string,
  item: { id: string; title: string; description: string },
  issueNumber: number | null
): Promise<{ number: number; html_url: string } | null> {
  const body = [
    `## Roadmap Item \`${item.id}\``,
    "",
    `**${item.title}**`,
    "",
    item.description,
    "",
    issueNumber != null ? `Closes #${issueNumber}` : "",
    "",
    "---",
    "🤖 Implemented by [Claude Code](https://claude.ai/claude-code) via workflow dispatch.",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const res = await fetch(`${GH_API}/repos/${REPO}/pulls`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({
      title: `feat(${item.id}): ${item.title}`,
      head: branchName,
      base: "main",
      body,
      draft: true,
    }),
  });

  if (!res.ok) {
    // 422 = PR already exists for this branch
    if (res.status === 422) {
      // Find existing PR
      const listRes = await fetch(
        `${GH_API}/repos/${REPO}/pulls?head=${REPO.split("/")[0]}:${branchName}&state=open`,
        { headers: ghHeaders(token) }
      );
      if (listRes.ok) {
        const prs = await listRes.json() as Array<{ number: number; html_url: string }>;
        if (prs.length > 0) return { number: prs[0].number, html_url: prs[0].html_url };
      }
    }
    console.error("Failed to create draft PR:", res.status, await res.text());
    return null;
  }

  const data = await res.json() as { number: number; html_url: string };
  return data;
}

export async function POST(request: Request) {
  // Verify monitor session
  const cookie = request.headers.get("cookie") ?? "";
  if (!cookie.includes(`${MONITOR_COOKIE}=1`)) {
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

  // 1. Create GitHub Issue (best-effort)
  const issueNumber = await createIssue(token, item);

  // 2. Create feature branch from main
  const mainSha = await getMainSha(token);
  if (mainSha) {
    await createBranch(token, branchName, mainSha);
  }

  // 3. Create draft PR immediately (UI shows it right away)
  const pr = await createDraftPr(token, branchName, item, issueNumber);
  const prNumber = pr?.number ?? null;
  const prUrl = pr?.html_url ?? null;

  // 4. Write KV override — flips UI to in-progress immediately
  await setRoadmapOverride(itemId, {
    status: "in-progress",
    pr: prNumber ?? undefined,
    issue: issueNumber ?? undefined,
    startedAt: new Date().toISOString(),
  });

  // 5. Trigger workflow_dispatch on GitHub Actions
  const dispatchRes = await fetch(
    `${GH_API}/repos/${REPO}/actions/workflows/claude-feature.yml/dispatches`,
    {
      method: "POST",
      headers: ghHeaders(token),
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
    console.error("GitHub dispatch failed:", dispatchRes.status, text);
    return NextResponse.json({ success: false, error: `GitHub dispatch failed: ${dispatchRes.status}` }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    issueNumber,
    issueUrl: issueNumber != null ? `https://github.com/${REPO}/issues/${issueNumber}` : null,
    prNumber,
    prUrl,
  });
}

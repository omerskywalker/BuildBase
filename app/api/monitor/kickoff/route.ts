import { NextResponse } from "next/server";
import { ROADMAP, REPO } from "@/lib/roadmap-data";
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

  // Create a GitHub Issue for this item (best-effort — dispatch proceeds even if this fails)
  const issueNumber = await createIssue(token, item);

  // Trigger workflow_dispatch on GitHub Actions
  const res = await fetch(
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
          branch_name: item.branch ?? `feat/item-${itemId}`,
          issue_number: issueNumber != null ? String(issueNumber) : "",
          retry: retry ? "true" : "false",
        },
      }),
    }
  );

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    console.error("GitHub dispatch failed:", res.status, text);
    return NextResponse.json({ success: false, error: `GitHub dispatch failed: ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    issueNumber,
    issueUrl: issueNumber != null ? `https://github.com/${REPO}/issues/${issueNumber}` : null,
    prUrl: null, // PR URL will be available once CI creates it
  });
}

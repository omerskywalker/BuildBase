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

async function getMainSha(token: string): Promise<string | null> {
  const res = await fetch(`${GH_API}/repos/${REPO}/git/ref/heads/main`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json() as { object: { sha: string } };
  return data.object?.sha ?? null;
}

async function createBranch(token: string, branchName: string, sha: string): Promise<boolean> {
  const res = await fetch(`${GH_API}/repos/${REPO}/git/refs`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  });
  return res.ok || res.status === 422; // 422 = already exists
}

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
    "### Agent References",
    `- [\`CLAUDE.md\`](https://github.com/${REPO}/blob/main/CLAUDE.md)`,
    `- [\`WIKI/index.md\`](https://github.com/${REPO}/blob/main/WIKI/index.md)`,
    `- [\`WIKI/gotchas.md\`](https://github.com/${REPO}/blob/main/WIKI/gotchas.md)`,
    scopeSection,
    "",
    "*Opened automatically by the BuildBase roadmap monitor at batch kickoff.*",
  ].join("\n");

  const res = await fetch(`${GH_API}/repos/${REPO}/issues`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ title: `[${item.id}] ${item.title}`, body }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { number: number };
  return data.number;
}

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
  ].join("\n");

  const res = await fetch(`${GH_API}/repos/${REPO}/pulls`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ title: `feat(${item.id}): ${item.title}`, head: branchName, base: "main", body, draft: true }),
  });

  if (!res.ok) {
    if (res.status === 422) {
      // Find existing PR
      const owner = REPO.split("/")[0];
      const listRes = await fetch(
        `${GH_API}/repos/${REPO}/pulls?head=${owner}:${branchName}&state=open`,
        { headers: ghHeaders(token) }
      );
      if (listRes.ok) {
        const prs = await listRes.json() as Array<{ number: number; html_url: string }>;
        if (prs.length > 0) return prs[0];
      }
    }
    return null;
  }

  return await res.json() as { number: number; html_url: string };
}

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

  // Get main SHA once for all branches
  const mainSha = await getMainSha(token);

  // Dispatch all in parallel — each gets a file scope contract so agents don't overlap
  const results = await Promise.all(
    itemsToKickoff.map(async (item) => {
      const branchName = item.branch ?? `feat/item-${item.id}`;

      const scopeLines = item.scope
        ? [
            `FILE SCOPE CONTRACT (parallel agent — do NOT violate):`,
            `  Owns (create/edit freely): ${item.scope.owns.join(", ")}`,
            `  Avoid (owned by sibling agents): ${item.scope.avoid.join(", ")}`,
            `  CRITICAL: Do NOT modify lib/roadmap-data.ts — the kickoff system manages status.`,
          ].join("\n")
        : `CRITICAL: Do NOT modify lib/roadmap-data.ts — the kickoff system manages status.`;

      // 1. Create issue (best-effort)
      const issueNumber = await createIssue(token, item);

      // 2. Create branch from main
      if (mainSha) {
        await createBranch(token, branchName, mainSha);
      }

      // 3. Create draft PR
      const pr = await createDraftPr(token, branchName, item, issueNumber);
      const prNumber = pr?.number ?? null;

      // 4. Write KV override
      await setRoadmapOverride(item.id, {
        status: "in-progress",
        pr: prNumber ?? undefined,
        issue: issueNumber ?? undefined,
        startedAt: new Date().toISOString(),
      });

      // 5. Dispatch workflow
      const res = await fetch(
        `${GH_API}/repos/${REPO}/actions/workflows/claude-feature.yml/dispatches`,
        {
          method: "POST",
          headers: ghHeaders(token),
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
        console.error(`Dispatch failed for item ${item.id}:`, res.status, text);
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

/**
 * Shared GitHub REST API helpers used by the roadmap kickoff routes.
 * All functions are best-effort — they log errors and return null/false
 * so callers can degrade gracefully rather than blow up the kickoff flow.
 */

const GH_API = "https://api.github.com";

export function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/** Returns the HEAD commit SHA of the default branch (main). */
export async function getMainSha(token: string, repo: string): Promise<string | null> {
  const res = await fetch(`${GH_API}/repos/${repo}/git/ref/heads/main`, {
    headers: ghHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json() as { object: { sha: string } };
  return data.object?.sha ?? null;
}

/**
 * Creates the feature branch from `mainSha`, then adds an empty initial
 * commit so GitHub will accept a draft PR (requires ≥1 commit ahead of base).
 *
 * - If the branch doesn't exist: creates it, then pushes an empty commit.
 * - If the branch exists but is at mainSha: pushes an empty commit.
 * - If the branch exists and already has commits: no-op (returns true).
 */
export async function ensureBranchReady(
  token: string,
  repo: string,
  branchName: string,
  mainSha: string,
  itemId: string,
  itemTitle: string
): Promise<boolean> {
  // 1. Create the branch (ignore 422 = already exists)
  const createRes = await fetch(`${GH_API}/repos/${repo}/git/refs`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
  });

  if (!createRes.ok && createRes.status !== 422) {
    console.error(`[github] createBranch failed: ${createRes.status}`);
    return false;
  }

  // 2. Check current HEAD of the branch
  const branchRes = await fetch(`${GH_API}/repos/${repo}/git/ref/heads/${branchName}`, {
    headers: ghHeaders(token),
  });
  if (!branchRes.ok) return false;
  const branchData = await branchRes.json() as { object: { sha: string } };
  const branchSha = branchData.object?.sha;

  // 3. If branch HEAD is the same as main, it has no commits ahead — add one
  if (branchSha === mainSha) {
    return createEmptyCommit(token, repo, branchName, mainSha, itemId, itemTitle);
  }

  // Branch already has commits ahead of main — nothing to do
  return true;
}

/**
 * Pushes an empty commit (same tree) onto the branch so it's ahead of main.
 * This satisfies GitHub's requirement for PR creation.
 */
async function createEmptyCommit(
  token: string,
  repo: string,
  branchName: string,
  parentSha: string,
  itemId: string,
  itemTitle: string
): Promise<boolean> {
  // Get the tree SHA from the parent commit
  const commitRes = await fetch(`${GH_API}/repos/${repo}/git/commits/${parentSha}`, {
    headers: ghHeaders(token),
  });
  if (!commitRes.ok) return false;
  const { tree } = await commitRes.json() as { tree: { sha: string } };

  // Create a new commit pointing to the same tree (empty diff)
  const newCommitRes = await fetch(`${GH_API}/repos/${repo}/git/commits`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({
      message: `chore(${itemId}): initialize branch\n\nPrepares branch for: ${itemTitle}`,
      tree: tree.sha,
      parents: [parentSha],
    }),
  });
  if (!newCommitRes.ok) {
    console.error(`[github] createEmptyCommit failed: ${newCommitRes.status}`);
    return false;
  }
  const { sha: newSha } = await newCommitRes.json() as { sha: string };

  // Advance the branch ref to the new commit
  const updateRes = await fetch(`${GH_API}/repos/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    headers: ghHeaders(token),
    body: JSON.stringify({ sha: newSha }),
  });
  if (!updateRes.ok) {
    console.error(`[github] updateRef failed: ${updateRes.status}`);
  }
  return updateRes.ok;
}

export interface GhPrResult {
  number: number;
  html_url: string;
}

/**
 * Creates a draft PR from `branchName` → main.
 * If a PR already exists for the branch (422), returns the existing one.
 */
export async function createDraftPr(
  token: string,
  repo: string,
  branchName: string,
  item: { id: string; title: string; description: string },
  issueNumber: number | null
): Promise<GhPrResult | null> {
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
    .filter(Boolean)
    .join("\n");

  const res = await fetch(`${GH_API}/repos/${repo}/pulls`, {
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
    if (res.status === 422) {
      // PR already exists — find and return it
      return findExistingPr(token, repo, branchName);
    }
    console.error(`[github] createDraftPr failed: ${res.status}`, await res.text());
    return null;
  }

  return await res.json() as GhPrResult;
}

/** Finds an open PR for the given head branch. */
async function findExistingPr(
  token: string,
  repo: string,
  branchName: string
): Promise<GhPrResult | null> {
  const owner = repo.split("/")[0];
  const res = await fetch(
    `${GH_API}/repos/${repo}/pulls?head=${owner}:${branchName}&state=open`,
    { headers: ghHeaders(token) }
  );
  if (!res.ok) return null;
  const prs = await res.json() as GhPrResult[];
  return prs[0] ?? null;
}

/**
 * Creates a GitHub Issue for a roadmap item.
 * Returns the issue number, or null on failure.
 */
export async function createIssue(
  token: string,
  repo: string,
  item: {
    id: string;
    title: string;
    description: string;
    branch?: string;
    scope?: { owns: string[]; avoid: string[] };
  }
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
    `- [\`CLAUDE.md\`](https://github.com/${repo}/blob/main/CLAUDE.md) — project conventions, architecture, design tokens`,
    `- [\`WIKI/index.md\`](https://github.com/${repo}/blob/main/WIKI/index.md) — current status, file map`,
    `- [\`WIKI/gotchas.md\`](https://github.com/${repo}/blob/main/WIKI/gotchas.md) — known pitfalls, read first`,
    "",
    "---",
    "*Opened automatically by the BuildBase roadmap monitor at kickoff.*",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const res = await fetch(`${GH_API}/repos/${repo}/issues`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ title: `[${item.id}] ${item.title}`, body }),
  });

  if (!res.ok) {
    console.error(`[github] createIssue failed: ${res.status}`, await res.text());
    return null;
  }

  const data = await res.json() as { number: number };
  return data.number;
}

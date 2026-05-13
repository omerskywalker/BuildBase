import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO ?? "omerskywalker/BuildBase";
const ROADMAP_PIN = process.env.ROADMAP_PIN;

function ghFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (init?.headers) {
    const provided = init.headers as Record<string, string>;
    Object.assign(headers, provided);
  }
  return fetch(`https://api.github.com/repos/${REPO}${path}`, { ...init, headers });
}

function requirePin(req: Request, res: Response): boolean {
  const pin = (req.headers["x-roadmap-pin"] as string) || (req.query.pin as string);
  if (!ROADMAP_PIN) {
    res.status(500).json({ error: "ROADMAP_PIN not configured" });
    return false;
  }
  if (pin !== ROADMAP_PIN) {
    res.status(401).json({ error: "Invalid PIN" });
    return false;
  }
  return true;
}

// GET /api/monitor/roadmap — live status for all items
router.get("/roadmap", async (req: Request, res: Response) => {
  if (!requirePin(req, res)) return;
  if (!GITHUB_TOKEN) return res.status(500).json({ error: "GITHUB_TOKEN not configured" });

  try {
    const [prsRes, issuesRes] = await Promise.all([
      ghFetch("/pulls?state=all&per_page=100&sort=created&direction=desc"),
      ghFetch("/issues?state=all&per_page=100&sort=created&direction=desc"),
    ]);

    const prs = (prsRes.ok ? await prsRes.json() : []) as any[];
    const issues = (issuesRes.ok ? await issuesRes.json() : []) as any[];

    const openPrNumbers: number[] = prs
      .filter((pr) => pr.state === "open")
      .map((pr) => pr.number);

    const checksMap: Record<number, string> = {};
    await Promise.all(
      openPrNumbers.slice(0, 10).map(async (prNum: number) => {
        const pr = prs.find((p) => p.number === prNum);
        if (!pr?.head?.sha) return;
        const checksRes = await ghFetch(`/commits/${pr.head.sha}/check-runs`);
        if (checksRes.ok) {
          const data: any = await checksRes.json();
          const runs: any[] = data.check_runs || [];
          if (runs.length === 0) checksMap[prNum] = "pending";
          else if (runs.every((r) => r.conclusion === "success")) checksMap[prNum] = "success";
          else if (runs.some((r) => r.conclusion === "failure")) checksMap[prNum] = "failure";
          else checksMap[prNum] = "in_progress";
        }
      }),
    );

    return res.json({ prs, issues, checks: checksMap });
  } catch (err) {
    logger.error("Failed to fetch monitor data", { err });
    return res.status(500).json({ error: "Failed to fetch GitHub data" });
  }
});

// POST /api/monitor/kickoff — create branch + draft PR + dispatch workflow
router.post("/kickoff", async (req: Request, res: Response) => {
  if (!requirePin(req, res)) return;
  if (!GITHUB_TOKEN) return res.status(500).json({ error: "GITHUB_TOKEN not configured" });

  const { itemId, title, description, branch, issueNumber } = req.body;
  if (!itemId || !title || !branch) {
    return res.status(400).json({ error: "Missing required fields: itemId, title, branch" });
  }

  try {
    // 1. Get main branch SHA
    const mainRef = await ghFetch("/git/ref/heads/main");
    if (!mainRef.ok) return res.status(500).json({ error: "Failed to get main branch" });
    const mainData: any = await mainRef.json();
    const sha: string = mainData.object.sha;

    // 2. Create branch (422 = already exists, which is fine)
    const branchRes = await ghFetch("/git/refs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    });

    if (!branchRes.ok && branchRes.status !== 422) {
      return res.status(500).json({ error: "Failed to create branch" });
    }

    // 3. Create draft PR
    const prRes = await ghFetch("/pulls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `feat(${itemId}): ${title}`,
        head: branch,
        base: "main",
        body: [
          `## Roadmap Item ${itemId}`,
          "",
          description || title,
          "",
          issueNumber ? `Closes #${issueNumber}` : "",
          "",
          "---",
          "_Automated by BuildBase Roadmap Monitor_",
        ].join("\n"),
        draft: true,
      }),
    });

    let prNumber: number | undefined;
    if (prRes.ok) {
      const prData: any = await prRes.json();
      prNumber = prData.number;
    } else if (prRes.status === 422) {
      const existingRes = await ghFetch(`/pulls?head=omerskywalker:${branch}&state=open`);
      if (existingRes.ok) {
        const existing = (await existingRes.json()) as any[];
        if (existing.length > 0) prNumber = existing[0].number;
      }
    }

    // 4. Dispatch workflow
    const dispatchRes = await ghFetch("/actions/workflows/claude-feature.yml/dispatches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          item_id: itemId,
          item_title: title,
          item_description: description || title,
          branch_name: branch,
          issue_number: issueNumber?.toString() ?? "",
          pr_number: prNumber?.toString() ?? "",
        },
      }),
    });

    if (!dispatchRes.ok && dispatchRes.status !== 204) {
      const errBody = await dispatchRes.text();
      logger.error("Workflow dispatch failed", { status: dispatchRes.status, body: errBody });
      return res.status(500).json({ error: "Workflow dispatch failed" });
    }

    return res.json({ success: true, branch, pr: prNumber, dispatched: true });
  } catch (err) {
    logger.error("Kickoff failed", { err, itemId });
    return res.status(500).json({ error: "Kickoff failed" });
  }
});

// POST /api/monitor/kickoff-batch — dispatch multiple items in parallel
router.post("/kickoff-batch", async (req: Request, res: Response) => {
  if (!requirePin(req, res)) return;
  if (!GITHUB_TOKEN) return res.status(500).json({ error: "GITHUB_TOKEN not configured" });

  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing items array" });
  }

  const port = process.env.PORT ?? 3001;
  const results = await Promise.allSettled(
    items.map(async (item: Record<string, unknown>) => {
      const kickoffRes = await fetch(`http://localhost:${port}/api/monitor/kickoff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-roadmap-pin": ROADMAP_PIN!,
        },
        body: JSON.stringify(item),
      });
      const data = (await kickoffRes.json()) as Record<string, unknown>;
      return { itemId: item.itemId, ...data };
    }),
  );

  const succeeded = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<Record<string, unknown>>).value);
  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => (r as PromiseRejectedResult).reason);

  return res.status(failed.length > 0 ? 207 : 200).json({ succeeded, failed });
});

// POST /api/monitor/fail — called by workflow on failure
router.post("/fail", async (req: Request, res: Response) => {
  const auth = (req.headers.authorization as string)?.replace("Bearer ", "");
  if (auth !== ROADMAP_PIN) return res.status(401).json({ error: "Unauthorized" });

  const { itemId } = req.body;
  logger.warn("Roadmap item failed", { itemId });
  return res.json({ ok: true });
});

export default router;

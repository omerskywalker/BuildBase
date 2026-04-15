import { NextResponse } from "next/server";
import { ROADMAP, REPO } from "@/lib/roadmap-data";
import { MONITOR_COOKIE } from "@/lib/constants";

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

  // Trigger workflow_dispatch on GitHub Actions
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
          item_id: itemId,
          item_title: item.title,
          item_description: item.description,
          branch_name: item.branch ?? `feat/item-${itemId}`,
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
    prUrl: null, // PR URL will be available once CI creates it
  });
}

import { NextResponse } from "next/server";
import { ROADMAP } from "@/lib/roadmap-data";
import { getRoadmapOverrides, setRoadmapOverride } from "@/lib/storage";

/**
 * Called by claude-feature.yml on workflow failure to flip the item from
 * "in-progress" to "failed" in KV so the monitor shows the correct state.
 *
 * Auth: Bearer token must match ROADMAP_PIN env var.
 * Body: { itemId: string }
 */
export async function POST(request: Request) {
  const pin = process.env.ROADMAP_PIN;
  if (!pin) {
    return NextResponse.json({ success: false, error: "ROADMAP_PIN not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${pin}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { itemId?: string };
  const { itemId } = body;

  if (!itemId) {
    return NextResponse.json({ success: false, error: "itemId required" }, { status: 400 });
  }

  const allItems = ROADMAP.flatMap((b) => b.items);
  const item = allItems.find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }

  // Preserve existing pr/issue from KV so they stay linked after a failure
  const overrides = await getRoadmapOverrides();
  const existing = overrides[itemId];

  const override = {
    status: "failed" as const,
    pr: existing?.pr ?? item.pr,
    issue: existing?.issue ?? item.issue,
    startedAt: existing?.startedAt,
    failedAt: new Date().toISOString(),
  };

  await setRoadmapOverride(itemId, override);
  console.log(`[monitor/fail] item=${itemId} pr=${override.pr ?? "none"} failedAt=${override.failedAt}`);

  return NextResponse.json({ success: true });
}

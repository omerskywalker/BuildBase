import { NextResponse } from "next/server";
import { ROADMAP } from "@/lib/roadmap-data";
import { getRoadmapOverrides, setRoadmapOverride } from "@/lib/storage";
import { safeEqual } from "@/lib/monitor-auth";

/**
 * Called by claude-feature.yml on workflow failure to flip the item from
 * "in-progress" to "failed" in KV so the monitor shows the correct state.
 *
 * Auth: Bearer <MONITOR_API_KEY>
 *
 * MONITOR_API_KEY is a separate secret from ROADMAP_PIN — principle of least
 * privilege: a leaked workflow log exposing the machine key doesn't compromise
 * the human-facing monitor login, and vice versa.
 * Falls back to ROADMAP_PIN if MONITOR_API_KEY is not set (backwards compat).
 *
 * safeEqual uses crypto.timingSafeEqual — prevents timing attacks on the key.
 */
export async function POST(request: Request) {
  // Prefer a dedicated machine secret; fall back to PIN for existing setups
  const expectedKey = process.env.MONITOR_API_KEY ?? process.env.ROADMAP_PIN ?? "";
  if (!expectedKey) {
    return NextResponse.json({ success: false, error: "Auth not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!bearer || !safeEqual(bearer, expectedKey)) {
    console.warn(`[monitor/fail] unauthorized attempt ip=${request.headers.get("x-forwarded-for") ?? "unknown"}`);
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

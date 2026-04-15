/**
 * KV-backed runtime status store for the roadmap monitor.
 * Overrides the static status in roadmap-data.ts so that clicking "Start"
 * immediately flips items to in-progress — no redeploy needed.
 *
 * Uses @upstash/redis (backed by Upstash Redis). All calls are wrapped in
 * try/catch so the monitor degrades gracefully if KV is not configured.
 */

import { Redis } from "@upstash/redis";

const KEY = "bb:roadmap-overrides";

function getRedis(): Redis | null {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

export interface RoadmapOverride {
  status: "in-progress" | "done" | "paused";
  pr?: number;
  issue?: number;
  startedAt?: string;
}

export async function getRoadmapOverrides(): Promise<Record<string, RoadmapOverride>> {
  try {
    const redis = getRedis();
    if (!redis) return {};
    const raw = await redis.get<Record<string, RoadmapOverride>>(KEY);
    return raw ?? {};
  } catch {
    // KV not configured or unavailable — page renders from static roadmap-data.ts only
    return {};
  }
}

export async function setRoadmapOverride(itemId: string, data: RoadmapOverride): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) {
      console.warn(`[storage] setRoadmapOverride skipped — Redis not configured`);
      return;
    }
    const current = await getRoadmapOverrides();
    await redis.set(KEY, { ...current, [itemId]: data });
  } catch {
    // non-fatal — monitor still works, just without live status updates
    console.warn(`[storage] setRoadmapOverride failed for ${itemId}`);
  }
}

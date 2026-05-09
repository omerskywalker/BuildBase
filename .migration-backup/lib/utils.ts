import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns "Solid Form ✅" if locked_in, null otherwise — never exposes raw form status to user */
export function getFormBadge(status: string | null | undefined): string | null {
  return status === "locked_in" ? "Solid Form ✅" : null;
}

/** Picks the correct default weight from a TemplateExercise based on tier + gender */
export function getDefaultWeight(
  te: {
    is_bodyweight: boolean;
    weight_pre_baseline_f: number;
    weight_pre_baseline_m: number;
    weight_default_f: number;
    weight_default_m: number;
    weight_post_baseline_f: number;
    weight_post_baseline_m: number;
  },
  tier: "pre_baseline" | "default" | "post_baseline",
  gender: "male" | "female" | "other" | "unset"
): number {
  if (te.is_bodyweight) return 0;
  const g = gender === "male" ? "m" : "f";
  if (tier === "pre_baseline") return te[`weight_pre_baseline_${g}`];
  if (tier === "post_baseline") return te[`weight_post_baseline_${g}`];
  return te[`weight_default_${g}`];
}

/** Formats weight for display — "0" → "BW" (bodyweight), otherwise "45 lbs" */
export function formatWeight(weight: number, isBodyweight?: boolean): string {
  if (isBodyweight || weight === 0) return "BW";
  return `${weight} lbs`;
}

/** Time elapsed label, e.g. "2 days ago" */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 1000 / 60 / 60);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/** Hours since a date string, used for soreness prompt gate (12h) */
export function hoursSince(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / 1000 / 60 / 60;
}

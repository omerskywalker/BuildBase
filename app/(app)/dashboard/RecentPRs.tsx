"use client";

import { Trophy } from "lucide-react";

export interface PREntry {
  exerciseName: string;
  weight: number;
  achievedAt: string;
}

interface RecentPRsProps {
  prs: PREntry[];
}

export default function RecentPRs({ prs }: RecentPRsProps) {
  if (prs.length === 0) {
    return (
      <div className="flex items-center justify-center text-content-muted text-sm py-6">
        No personal records yet — keep lifting!
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {prs.map((pr) => (
        <li key={pr.exerciseName} className="flex items-center gap-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-warning/15 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-content-primary truncate">
              {pr.exerciseName}
            </div>
            <div className="text-xs text-content-muted">
              {new Date(pr.achievedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="text-sm font-semibold text-accent tabular-nums">
            {pr.weight} lbs
          </div>
        </li>
      ))}
    </ul>
  );
}

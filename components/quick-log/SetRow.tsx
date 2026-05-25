"use client";

import { Plus, Minus, CheckCircle2, X } from "lucide-react";
import type { QuickSet } from "./types";

export function SetRow({
  set,
  index,
  bodyweight,
  onChange,
  onRemove,
}: {
  set: QuickSet;
  index: number;
  bodyweight: boolean;
  onChange: (updated: Partial<QuickSet>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span
        className="text-xs font-semibold w-10 text-center shrink-0 rounded"
        style={{ color: "#988A78", background: "#E0D4C0", padding: "2px 6px" }}
      >
        Set {index + 1}
      </span>

      <div className="flex items-center gap-1 rounded-lg border px-2 py-1" style={{ borderColor: "#C8B99D", background: "#EDE4D3" }}>
        <button
          onClick={() => onChange({ reps: Math.max(1, set.reps - 1) })}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white transition-colors"
          style={{ color: "#6B5A48" }}
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center text-sm font-medium" style={{ color: "#2C1A10" }}>
          {set.reps}
        </span>
        <button
          onClick={() => onChange({ reps: set.reps + 1 })}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white transition-colors"
          style={{ color: "#6B5A48" }}
        >
          <Plus className="h-3 w-3" />
        </button>
        <span className="text-xs ml-1" style={{ color: "#988A78" }}>reps</span>
      </div>

      {!bodyweight && (
        <div className="flex items-center gap-1 rounded-lg border px-2 py-1" style={{ borderColor: "#C8B99D", background: "#EDE4D3" }}>
          <input
            type="number"
            min={0}
            step={2.5}
            value={set.weight || ""}
            onChange={e => onChange({ weight: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="w-12 text-center text-sm bg-transparent outline-none"
            style={{ color: "#2C1A10" }}
          />
          <span className="text-xs" style={{ color: "#988A78" }}>lbs</span>
        </div>
      )}

      {bodyweight && (
        <span className="text-xs px-2 py-1 rounded border" style={{ color: "#988A78", borderColor: "#C8B99D", background: "#EDE4D3" }}>
          BW
        </span>
      )}

      <button
        onClick={() => onChange({ completed: !set.completed })}
        className="ml-auto shrink-0 transition-colors"
        style={{ color: set.completed ? "#2D7A3A" : "#C8B99D" }}
        title="Mark complete"
      >
        <CheckCircle2 className="h-5 w-5" />
      </button>

      <button
        onClick={onRemove}
        className="shrink-0 transition-colors hover:text-red-600"
        style={{ color: "#C8B99D" }}
        title="Remove set"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

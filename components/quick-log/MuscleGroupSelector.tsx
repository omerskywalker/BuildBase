"use client";

import { Button } from "@/components/ui/button";
import {
  MUSCLE_GROUPS,
  type MuscleGroupKey,
} from "@/lib/quick-log-presets";

export function MuscleGroupSelector({
  selected,
  onToggle,
  onNext,
}: {
  selected: MuscleGroupKey[];
  onToggle: (key: MuscleGroupKey) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "#6B5A48" }}>
        Pick one or more muscle groups to train today. We&apos;ll pre-fill a workout for you.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {MUSCLE_GROUPS.map(mg => {
          const isSelected = selected.includes(mg.key);
          return (
            <button
              key={mg.key}
              onClick={() => onToggle(mg.key)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-4 transition-all duration-150 font-medium text-sm"
              style={{
                background: isSelected ? "#FFF2EC" : "#EDE4D3",
                borderColor: isSelected ? "#C84B1A" : "#C8B99D",
                color: isSelected ? "#C84B1A" : "#6B5A48",
                transform: isSelected ? "scale(1.03)" : "scale(1)",
              }}
            >
              <span className="text-xl">{mg.emoji}</span>
              <span>{mg.label}</span>
            </button>
          );
        })}
      </div>
      <Button
        onClick={onNext}
        disabled={selected.length === 0}
        className="w-full font-semibold"
        style={{ background: selected.length > 0 ? "#C84B1A" : "#C8B99D", color: "#fff", border: "none" }}
      >
        Build Workout →
      </Button>
    </div>
  );
}

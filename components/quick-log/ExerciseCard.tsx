"use client";

import { Plus, X } from "lucide-react";
import { SetRow } from "./SetRow";
import { makeSet } from "./types";
import type { QuickSet, QuickExercise } from "./types";

export function ExerciseCard({
  exercise,
  muscleLabel,
  onUpdate,
  onRemove,
}: {
  exercise: QuickExercise;
  muscleLabel: string;
  onUpdate: (updated: QuickExercise) => void;
  onRemove: () => void;
}) {
  const updateSet = (setId: string, partial: Partial<QuickSet>) => {
    onUpdate({ ...exercise, sets: exercise.sets.map(s => s.id === setId ? { ...s, ...partial } : s) });
  };
  const removeSet = (setId: string) => {
    if (exercise.sets.length <= 1) return;
    onUpdate({ ...exercise, sets: exercise.sets.filter(s => s.id !== setId) });
  };
  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    onUpdate({ ...exercise, sets: [...exercise.sets, makeSet(lastSet?.reps ?? 10)] });
  };

  const completedCount = exercise.sets.filter(s => s.completed).length;

  return (
    <div className="rounded-xl border p-4 space-y-2" style={{ background: "#F7F3EC", borderColor: "#D4C8B4" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "#2C1A10" }}>{exercise.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#EDE4D3", color: "#6B5A48" }}>
              {muscleLabel}
            </span>
            {completedCount > 0 && (
              <span className="text-xs" style={{ color: "#2D7A3A" }}>
                {completedCount}/{exercise.sets.length} sets done
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="rounded-lg p-1.5 hover:bg-red-50 transition-colors shrink-0"
          style={{ color: "#988A78" }}
          title="Remove exercise"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-0 divide-y" style={{ borderColor: "#E8DDD0" }}>
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            index={i}
            bodyweight={exercise.bodyweight}
            onChange={partial => updateSet(set.id, partial)}
            onRemove={() => removeSet(set.id)}
          />
        ))}
      </div>

      <button
        onClick={addSet}
        className="flex items-center gap-1.5 text-xs font-medium mt-1 px-2 py-1.5 rounded-lg border border-dashed transition-colors hover:bg-white"
        style={{ color: "#C84B1A", borderColor: "#C84B1A" }}
      >
        <Plus className="h-3 w-3" /> Add Set
      </button>
    </div>
  );
}

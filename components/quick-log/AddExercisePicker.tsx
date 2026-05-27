"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  MUSCLE_GROUPS,
  EXERCISES_BY_MUSCLE,
  type MuscleGroupKey,
} from "@/lib/quick-log-presets";

export function AddExercisePicker({
  selectedMuscles,
  existing,
  onAdd,
  onClose,
}: {
  selectedMuscles: MuscleGroupKey[];
  existing: string[];
  onAdd: (name: string, muscle: MuscleGroupKey, bodyweight: boolean) => void;
  onClose: () => void;
}) {
  const [activeMuscle, setActiveMuscle] = useState<MuscleGroupKey>(selectedMuscles[0]);
  const candidates = EXERCISES_BY_MUSCLE[activeMuscle] ?? [];

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: "70vh" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm" style={{ color: "#2C1A10" }}>Add Exercise</span>
        <button onClick={onClose} className="p-1 rounded" style={{ color: "#988A78" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {selectedMuscles.map(m => {
          const mg = MUSCLE_GROUPS.find(g => g.key === m);
          return (
            <button
              key={m}
              onClick={() => setActiveMuscle(m)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={{
                background: activeMuscle === m ? "#C84B1A" : "#EDE4D3",
                color: activeMuscle === m ? "#fff" : "#6B5A48",
                borderColor: activeMuscle === m ? "#C84B1A" : "#C8B99D",
              }}
            >
              {mg?.label ?? m}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {candidates.map(ex => {
          const alreadyAdded = existing.includes(ex.name);
          return (
            <button
              key={ex.name}
              disabled={alreadyAdded}
              onClick={() => {
                onAdd(ex.name, ex.muscleGroup, ex.bodyweight ?? false);
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors"
              style={{
                background: alreadyAdded ? "#F0EAE0" : "#EDE4D3",
                borderColor: alreadyAdded ? "#D4C8B4" : "#C8B99D",
                opacity: alreadyAdded ? 0.5 : 1,
                cursor: alreadyAdded ? "not-allowed" : "pointer",
              }}
            >
              <span className="text-sm font-medium" style={{ color: "#2C1A10" }}>{ex.name}</span>
              <span className="text-xs" style={{ color: "#988A78" }}>
                {alreadyAdded ? "Added" : `${ex.defaultReps} reps`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

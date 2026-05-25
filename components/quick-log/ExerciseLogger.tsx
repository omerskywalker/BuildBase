"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, CheckCircle2, Loader2, Dumbbell } from "lucide-react";
import {
  MUSCLE_GROUPS,
  EXERCISES_BY_MUSCLE,
  type MuscleGroupKey,
} from "@/lib/quick-log-presets";
import { ExerciseCard } from "./ExerciseCard";
import { AddExercisePicker } from "./AddExercisePicker";
import { makeExercise } from "./types";
import type { QuickExercise } from "./types";

export function ExerciseLogger({
  selectedMuscles,
  exercises,
  onBack,
  onUpdateExercises,
  onSave,
  saving,
  saved,
}: {
  selectedMuscles: MuscleGroupKey[];
  exercises: QuickExercise[];
  onBack: () => void;
  onUpdateExercises: (exercises: QuickExercise[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const [showAddPicker, setShowAddPicker] = useState(false);

  const updateExercise = (id: string, updated: QuickExercise) =>
    onUpdateExercises(exercises.map(ex => ex.id === id ? updated : ex));
  const removeExercise = (id: string) =>
    onUpdateExercises(exercises.filter(ex => ex.id !== id));
  const addExercise = (name: string, muscle: MuscleGroupKey, bodyweight: boolean) => {
    const preset = EXERCISES_BY_MUSCLE[muscle]?.find(e => e.name === name);
    onUpdateExercises([...exercises, makeExercise(name, muscle, preset?.defaultReps ?? 10, 3, bodyweight)]);
  };

  const existingNames = exercises.map(e => e.name);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const muscleLabels = Object.fromEntries(MUSCLE_GROUPS.map(mg => [mg.key, mg.label]));

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-16 w-16 mb-4" style={{ color: "#2D7A3A" }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "#2C1A10" }}>Workout Saved!</h2>
        <p className="text-sm" style={{ color: "#6B5A48" }}>
          {completedSets} sets logged across {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white transition-colors" style={{ color: "#6B5A48" }}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1">
            {selectedMuscles.map(m => (
              <span key={m} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#FFF2EC", color: "#C84B1A", border: "1px solid #F5C9B3" }}>
                {muscleLabels[m] ?? m}
              </span>
            ))}
          </div>
          {totalSets > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "#988A78" }}>
              {completedSets}/{totalSets} sets marked done
            </p>
          )}
        </div>
      </div>

      {showAddPicker && (
        <div className="rounded-xl border p-4 mb-4" style={{ background: "#F7F3EC", borderColor: "#D4C8B4" }}>
          <AddExercisePicker
            selectedMuscles={selectedMuscles}
            existing={existingNames}
            onAdd={addExercise}
            onClose={() => setShowAddPicker(false)}
          />
        </div>
      )}

      <div className="space-y-3 flex-1 overflow-y-auto pb-2 max-h-[45vh]">
        {exercises.length === 0 ? (
          <div className="text-center py-8" style={{ color: "#988A78" }}>
            <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No exercises yet — add one below</p>
          </div>
        ) : (
          exercises.map(ex => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              muscleLabel={muscleLabels[ex.muscleGroup] ?? ex.muscleGroup}
              onUpdate={updated => updateExercise(ex.id, updated)}
              onRemove={() => removeExercise(ex.id)}
            />
          ))
        )}
      </div>

      <div className="pt-3 space-y-2 border-t mt-3" style={{ borderColor: "#E8DDD0" }}>
        {!showAddPicker && (
          <button
            onClick={() => setShowAddPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-white"
            style={{ color: "#C84B1A", borderColor: "#F5C9B3", background: "#FFF8F4" }}
          >
            <Plus className="h-4 w-4" /> Add Exercise
          </button>
        )}
        <Button
          onClick={onSave}
          disabled={saving || exercises.length === 0}
          className="w-full font-semibold"
          style={{ background: exercises.length === 0 ? "#C8B99D" : "#1C3A2A", color: "#fff", border: "none" }}
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Complete Workout ✓"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { apiFetchJson } from "@/lib/api-helpers";
import {
  getPresetExercises,
  type MuscleGroupKey,
} from "@/lib/quick-log-presets";
import { MuscleGroupSelector } from "./MuscleGroupSelector";
import { ExerciseLogger } from "./ExerciseLogger";
import { makeExercise } from "./types";
import type { QuickExercise } from "./types";

export default function QuickLogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroupKey[]>([]);
  const [exercises, setExercises] = useState<QuickExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleMuscle = useCallback((key: MuscleGroupKey) => {
    setSelectedMuscles(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  }, []);

  const handleNext = () => {
    const presets = getPresetExercises(selectedMuscles);
    setExercises(presets.map(p => makeExercise(p.name, p.muscleGroup, p.defaultReps, p.defaultSets, p.bodyweight ?? false)));
    setStep(2);
  };

  const handleBack = () => { setStep(1); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const start = performance.now();
      await apiFetchJson("/api/quick-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muscleGroups: selectedMuscles,
          exercises: exercises.map(ex => ({ name: ex.name, muscleGroup: ex.muscleGroup, sets: ex.sets })),
        }),
      });
      const elapsed = performance.now() - start;
      if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
      setSaved(true);
      setTimeout(() => { onClose(); setStep(1); setSelectedMuscles([]); setExercises([]); setSaved(false); }, 2000);
    } catch {
      toast.error("Couldn't save your workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep(1); setSelectedMuscles([]); setExercises([]); setSaved(false); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose(); }}>
      <DialogContent
        className="max-w-md w-full mx-auto"
        style={{ background: "#FAF6F0", borderColor: "#D4C8B4", maxHeight: "90vh", overflowY: "auto" }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: "#2C1A10" }}>
            <Dumbbell className="h-5 w-5" style={{ color: "#C84B1A" }} />
            {step === 1 ? "Log Workout" : "Today's Workout"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && <MuscleGroupSelector selected={selectedMuscles} onToggle={toggleMuscle} onNext={handleNext} />}
        {step === 2 && (
          <ExerciseLogger
            selectedMuscles={selectedMuscles}
            exercises={exercises}
            onBack={handleBack}
            onUpdateExercises={setExercises}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

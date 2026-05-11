import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, ChevronLeft, CheckCircle2, Loader2, Dumbbell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  MUSCLE_GROUPS,
  EXERCISES_BY_MUSCLE,
  getPresetExercises,
  type MuscleGroupKey,
} from "@/lib/quick-log-presets";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

interface QuickExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroupKey;
  bodyweight: boolean;
  sets: QuickSet[];
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function makeSet(reps: number): QuickSet {
  return { id: uid(), reps, weight: 0, completed: false };
}

function makeExercise(
  name: string,
  muscleGroup: MuscleGroupKey,
  defaultReps: number,
  defaultSets: number,
  bodyweight = false
): QuickExercise {
  return {
    id: uid(),
    name,
    muscleGroup,
    bodyweight,
    sets: Array.from({ length: defaultSets }, () => makeSet(defaultReps)),
  };
}

// ─── Add Exercise Picker ───────────────────────────────────────────────────────

interface AddExercisePickerProps {
  selectedMuscles: MuscleGroupKey[];
  existing: string[];
  onAdd: (name: string, muscle: MuscleGroupKey, bodyweight: boolean) => void;
  onClose: () => void;
}

function AddExercisePicker({ selectedMuscles, existing, onAdd, onClose }: AddExercisePickerProps) {
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

// ─── Set Row ──────────────────────────────────────────────────────────────────

interface SetRowProps {
  set: QuickSet;
  index: number;
  bodyweight: boolean;
  onChange: (updated: Partial<QuickSet>) => void;
  onRemove: () => void;
}

function SetRow({ set, index, bodyweight, onChange, onRemove }: SetRowProps) {
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

// ─── Exercise Card ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: QuickExercise;
  muscleLabel: string;
  onUpdate: (updated: QuickExercise) => void;
  onRemove: () => void;
}

function ExerciseCard({ exercise, muscleLabel, onUpdate, onRemove }: ExerciseCardProps) {
  const updateSet = (setId: string, partial: Partial<QuickSet>) => {
    onUpdate({
      ...exercise,
      sets: exercise.sets.map(s => s.id === setId ? { ...s, ...partial } : s),
    });
  };

  const removeSet = (setId: string) => {
    if (exercise.sets.length <= 1) return;
    onUpdate({ ...exercise, sets: exercise.sets.filter(s => s.id !== setId) });
  };

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    onUpdate({
      ...exercise,
      sets: [...exercise.sets, makeSet(lastSet?.reps ?? 10)],
    });
  };

  const completedCount = exercise.sets.filter(s => s.completed).length;

  return (
    <div
      className="rounded-xl border p-4 space-y-2"
      style={{ background: "#F7F3EC", borderColor: "#D4C8B4" }}
    >
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

// ─── Step 1: Muscle Group Picker ─────────────────────────────────────────────

interface MusclePickerProps {
  selected: MuscleGroupKey[];
  onToggle: (key: MuscleGroupKey) => void;
  onNext: () => void;
}

function MusclePicker({ selected, onToggle, onNext }: MusclePickerProps) {
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "#6B5A48" }}>
        Pick one or more muscle groups to train today. We'll pre-fill a workout for you.
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
        style={{
          background: selected.length > 0 ? "#C84B1A" : "#C8B99D",
          color: "#fff",
          border: "none",
        }}
      >
        Build Workout →
      </Button>
    </div>
  );
}

// ─── Step 2: Exercise Logger ──────────────────────────────────────────────────

interface ExerciseLoggerProps {
  selectedMuscles: MuscleGroupKey[];
  exercises: QuickExercise[];
  onBack: () => void;
  onUpdateExercises: (exercises: QuickExercise[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

function ExerciseLogger({
  selectedMuscles,
  exercises,
  onBack,
  onUpdateExercises,
  onSave,
  saving,
  saved,
}: ExerciseLoggerProps) {
  const [showAddPicker, setShowAddPicker] = useState(false);

  const updateExercise = (id: string, updated: QuickExercise) => {
    onUpdateExercises(exercises.map(ex => ex.id === id ? updated : ex));
  };

  const removeExercise = (id: string) => {
    onUpdateExercises(exercises.filter(ex => ex.id !== id));
  };

  const addExercise = (name: string, muscle: MuscleGroupKey, bodyweight: boolean) => {
    const preset = EXERCISES_BY_MUSCLE[muscle]?.find(e => e.name === name);
    const newEx = makeExercise(name, muscle, preset?.defaultReps ?? 10, 3, bodyweight);
    onUpdateExercises([...exercises, newEx]);
  };

  const existingNames = exercises.map(e => e.name);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);

  const muscleLabels = Object.fromEntries(
    MUSCLE_GROUPS.map(mg => [mg.key, mg.label])
  );

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
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white transition-colors"
          style={{ color: "#6B5A48" }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1">
            {selectedMuscles.map(m => (
              <span
                key={m}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#FFF2EC", color: "#C84B1A", border: "1px solid #F5C9B3" }}
              >
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

      {showAddPicker ? (
        <div
          className="rounded-xl border p-4 mb-4"
          style={{ background: "#F7F3EC", borderColor: "#D4C8B4" }}
        >
          <AddExercisePicker
            selectedMuscles={selectedMuscles}
            existing={existingNames}
            onAdd={addExercise}
            onClose={() => setShowAddPicker(false)}
          />
        </div>
      ) : null}

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
          style={{
            background: exercises.length === 0 ? "#C8B99D" : "#1C3A2A",
            color: "#fff",
            border: "none",
          }}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
          ) : (
            "Complete Workout ✓"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface QuickLogModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickLogModal({ open, onClose }: QuickLogModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroupKey[]>([]);
  const [exercises, setExercises] = useState<QuickExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleMuscle = useCallback((key: MuscleGroupKey) => {
    setSelectedMuscles(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  }, []);

  const handleNext = () => {
    const presets = getPresetExercises(selectedMuscles);
    const exs = presets.map(p =>
      makeExercise(p.name, p.muscleGroup, p.defaultReps, p.defaultSets, p.bodyweight ?? false)
    );
    setExercises(exs);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const start = performance.now();
      await apiFetch("/api/quick-log", {
        method: "POST",
        body: JSON.stringify({
          muscleGroups: selectedMuscles,
          exercises: exercises.map(ex => ({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: ex.sets,
          })),
        }),
      });
      const elapsed = performance.now() - start;
      if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
      setSaved(true);
      setTimeout(() => {
        onClose();
        setStep(1);
        setSelectedMuscles([]);
        setExercises([]);
        setSaved(false);
      }, 2000);
    } catch {
      // still close gracefully
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setSelectedMuscles([]);
      setExercises([]);
      setSaved(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); }}>
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

        {step === 1 && (
          <MusclePicker
            selected={selectedMuscles}
            onToggle={toggleMuscle}
            onNext={handleNext}
          />
        )}

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

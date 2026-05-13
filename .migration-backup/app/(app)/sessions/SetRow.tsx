"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import WeightControl from "./WeightControl";
import { TemplateExercise } from "@/lib/types";
import { getDefaultWeight } from "@/lib/utils";

interface LoggedSet {
  setLogId: string;
  weight: number | null;
  reps: number | null;
}

interface SetRowProps {
  sessionLogId: string;
  templateExercise: TemplateExercise;
  setNumber: number;
  tier: "pre_baseline" | "default" | "post_baseline";
  gender: "male" | "female" | "other" | "unset";
  existingLog?: LoggedSet;
}

export default function SetRow({
  sessionLogId,
  templateExercise,
  setNumber,
  tier,
  gender,
  existingLog,
}: SetRowProps) {
  const defaultWeight = getDefaultWeight(templateExercise, tier, gender);

  const [weight, setWeight] = useState<number>(existingLog?.weight ?? defaultWeight);
  const [reps, setReps] = useState<number>(existingLog?.reps ?? templateExercise.reps_default);
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(existingLog != null);

  const handleLog = async () => {
    if (isLogging || isLogged) return;
    setIsLogging(true);
    try {
      const res = await fetch(`/api/sessions/${sessionLogId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_exercise_id: templateExercise.id,
          exercise_id: templateExercise.exercise_id,
          set_number: setNumber,
          weight_used: templateExercise.is_bodyweight ? null : weight,
          reps_completed: reps,
        }),
      });
      if (res.ok) {
        setIsLogged(true);
      }
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isLogged ? "bg-success/8 border border-success/20" : "bg-bg-surface border border-transparent"
      }`}
    >
      {/* Set number */}
      <span className="text-xs font-bold text-content-muted w-6 shrink-0 text-center">
        {setNumber}
      </span>

      {/* Weight control */}
      <div className="flex items-center gap-2 flex-1">
        <WeightControl
          value={weight}
          onChange={setWeight}
          isBodyweight={templateExercise.is_bodyweight}
          disabled={isLogged}
        />
      </div>

      {/* Rep control */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setReps((r) => Math.max(1, r - 1))}
          disabled={isLogged || reps <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-md text-content-secondary border border-border-subtle bg-bg-surface hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          aria-label="Decrease reps"
        >
          −
        </button>
        <span className="min-w-[40px] text-center text-sm font-semibold text-content-primary">
          {reps}
          <span className="text-xs text-content-muted ml-0.5">r</span>
        </span>
        <button
          type="button"
          onClick={() => setReps((r) => r + 1)}
          disabled={isLogged}
          className="w-7 h-7 flex items-center justify-center rounded-md text-content-secondary border border-border-subtle bg-bg-surface hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          aria-label="Increase reps"
        >
          +
        </button>
      </div>

      {/* Log button */}
      <button
        type="button"
        onClick={handleLog}
        disabled={isLogging || isLogged}
        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all ${
          isLogged
            ? "bg-success/20 text-success cursor-default"
            : isLogging
            ? "bg-accent/20 text-accent cursor-wait"
            : "bg-accent hover:bg-accent-dim text-white cursor-pointer"
        }`}
        aria-label={isLogged ? "Set logged" : "Log set"}
      >
        <Check className="w-4 h-4" strokeWidth={isLogged ? 3 : 2} />
      </button>
    </div>
  );
}

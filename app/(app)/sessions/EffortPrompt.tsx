"use client";

import { useState, useEffect } from "react";
import { EFFORT_LABELS } from "@/lib/constants";

interface EffortPromptProps {
  sessionLogId: string;
  onDismiss: () => void;
}

const SCORES = [1, 2, 3, 4, 5] as const;
type EffortScore = (typeof SCORES)[number];

export default function EffortPrompt({ sessionLogId, onDismiss }: EffortPromptProps) {
  const [selected, setSelected] = useState<EffortScore | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-dismiss 4 seconds after a selection is confirmed
  useEffect(() => {
    if (selected === null) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [selected, onDismiss]);

  const handleSelect = async (score: EffortScore) => {
    if (submitting || selected !== null) return;
    setSubmitting(true);
    try {
      await fetch(`/api/sessions/${sessionLogId}/effort`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      setSelected(score);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="How was your effort today?"
      className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-3"
    >
      <p className="text-sm font-semibold text-content-primary text-center">
        How was your effort today?
      </p>

      <div className="flex gap-2 justify-center">
        {SCORES.map((score) => {
          const { emoji, label, color } = EFFORT_LABELS[score];
          const isSelected = selected === score;
          return (
            <button
              key={score}
              type="button"
              onClick={() => handleSelect(score)}
              disabled={submitting || selected !== null}
              aria-label={`${score} — ${label}`}
              style={isSelected ? { borderColor: color, background: `${color}22` } : undefined}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all
                ${isSelected
                  ? "opacity-100"
                  : "border-border-subtle bg-bg-surface hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span className="text-[10px] text-content-secondary font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="text-xs text-content-muted text-center">
          {EFFORT_LABELS[selected].label} logged — closing in a moment…
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { SORENESS_LABELS, SORENESS_PROMPT_GAP_HOURS } from "@/lib/constants";
import { hoursSince } from "@/lib/utils";

interface SorenessPromptProps {
  sessionLogId: string;
  lastCompletedAt: string | null;
  sorenessPrompted: boolean;
  onDismiss: () => void;
}

const SCORES = [1, 2, 3, 4, 5] as const;
type SorenessScore = (typeof SCORES)[number];

export default function SorenessPrompt({
  sessionLogId,
  lastCompletedAt,
  sorenessPrompted,
  onDismiss,
}: SorenessPromptProps) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Only show if: gap is over threshold AND not yet prompted this session
  const shouldShow =
    !sorenessPrompted &&
    !done &&
    hoursSince(lastCompletedAt) > SORENESS_PROMPT_GAP_HOURS;

  if (!shouldShow) return null;

  const handleSelect = async (score: SorenessScore) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/sessions/${sessionLogId}/soreness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      setDone(true);
      onDismiss();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="How are you feeling today?"
      className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-3"
    >
      <p className="text-sm font-semibold text-content-primary text-center">
        How&apos;s the body feeling today?
      </p>
      <p className="text-xs text-content-muted text-center">
        It&apos;s been a while since your last session.
      </p>

      <div className="flex gap-2 justify-center">
        {SCORES.map((score) => {
          const { emoji, label } = SORENESS_LABELS[score];
          return (
            <button
              key={score}
              type="button"
              onClick={() => handleSelect(score)}
              disabled={submitting}
              aria-label={`${score} — ${label}`}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span className="text-[10px] text-content-secondary font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

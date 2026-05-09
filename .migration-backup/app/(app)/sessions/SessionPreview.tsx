"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionLog, WorkoutTemplate, TemplateExercise } from "@/lib/types";
import { formatWeight, getDefaultWeight } from "@/lib/utils";
import { Eye, Loader2 } from "lucide-react";

interface SessionPreviewProps {
  session: SessionLog & { template?: WorkoutTemplate };
  open: boolean;
  onClose: () => void;
  userTier: "pre_baseline" | "default" | "post_baseline";
  userGender: "male" | "female" | "other" | "unset";
}

export default function SessionPreview({
  session,
  open,
  onClose,
  userTier,
  userGender,
}: SessionPreviewProps) {
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !session.workout_template_id) return;

    setLoading(true);
    fetch(`/api/templates/${session.workout_template_id}/exercises`)
      .then((r) => r.json())
      .then((data: { exercises: TemplateExercise[] }) => {
        setExercises(data.exercises ?? []);
      })
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, [open, session.workout_template_id]);

  const sessionTitle = session.template?.title ?? `Session ${session.session_number}`;
  const dayLabel = session.template?.day_label;

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-bg-elevated border-border-subtle">
        <DialogHeader>
          <DialogTitle className="text-content-primary">
            {dayLabel && (
              <span className="text-content-muted text-sm font-normal mr-2">Day {dayLabel}</span>
            )}
            <span>{sessionTitle}</span>
          </DialogTitle>
          <div className="flex items-center gap-1.5 text-xs text-content-secondary mt-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Preview — default weights for your tier</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-6 text-content-secondary text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading exercises…
            </div>
          )}

          {!loading && exercises.map((te) => {
            const defaultWeight = getDefaultWeight(te, userTier, userGender);
            return (
              <div key={te.id} className="space-y-1">
                <p className="text-sm font-semibold text-content-primary">
                  {te.exercise?.name ?? "Exercise"}
                  {te.exercise?.muscle_group && (
                    <span className="text-content-muted font-normal text-xs ml-2">
                      {te.exercise.muscle_group}
                    </span>
                  )}
                </p>

                {te.coaching_cues && (
                  <p className="text-xs text-content-secondary italic pl-1">{te.coaching_cues}</p>
                )}

                <div className="flex items-center gap-3 px-3 text-xs text-content-muted">
                  <span className="w-8">Sets</span>
                  <span className="min-w-[64px]">Weight</span>
                  <span>Reps</span>
                </div>

                <div className="flex items-center gap-3 px-3 text-xs text-content-secondary">
                  <span className="w-8">{te.sets_default}×</span>
                  <span className="min-w-[64px]">{formatWeight(defaultWeight, te.is_bodyweight)}</span>
                  <span>{te.reps_default} reps</span>
                </div>
              </div>
            );
          })}

          {!loading && exercises.length === 0 && (
            <p className="text-sm text-content-muted text-center py-2">No exercises assigned to this session.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

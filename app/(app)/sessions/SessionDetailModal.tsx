"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionLog, WorkoutTemplate, TemplateExercise, SetLog } from "@/lib/types";
import { formatWeight, timeAgo } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const EFFORT_LABELS: Record<number, string> = {
  1: "🔴 Easy",
  2: "🟡 Moderate",
  3: "🟢 Good",
  4: "🔵 Hard",
  5: "💪 Maxed",
};

interface ExerciseDetail {
  templateExercise: TemplateExercise;
  setLogs: SetLog[];
}

interface SessionDetailModalProps {
  session: SessionLog & { template?: WorkoutTemplate };
  open: boolean;
  onClose: () => void;
}

export default function SessionDetailModal({
  session,
  open,
  onClose,
}: SessionDetailModalProps) {
  const [exercises, setExercises] = useState<ExerciseDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !session.id || session.id.startsWith("virtual-")) return;

    setLoading(true);
    fetch(`/api/sessions/${session.id}/exercises`)
      .then((r) => r.json())
      .then((data: { exercises: TemplateExercise[]; setLogs: SetLog[] }) => {
        const merged: ExerciseDetail[] = data.exercises.map((te) => ({
          templateExercise: te,
          setLogs: data.setLogs.filter((sl) => sl.template_exercise_id === te.id),
        }));
        setExercises(merged);
      })
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, [open, session.id]);

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
          {session.completed_at && (
            <p className="text-xs text-content-secondary mt-1">
              Completed {timeAgo(session.completed_at)} &mdash;{" "}
              {new Date(session.completed_at).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </DialogHeader>

        {/* Effort badge */}
        {session.post_session_effort && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-hover text-sm">
            <span className="text-content-secondary">Effort:</span>
            <span className="font-medium text-content-primary">
              {EFFORT_LABELS[session.post_session_effort]}
            </span>
          </div>
        )}

        {/* Notes */}
        {session.notes && (
          <div className="px-3 py-2 rounded-md bg-bg-hover text-sm">
            <p className="text-content-secondary mb-1 text-xs uppercase tracking-wide">Notes</p>
            <p className="text-content-primary">{session.notes}</p>
          </div>
        )}

        {/* Exercise breakdown */}
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-6 text-content-secondary text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading sets…
            </div>
          )}

          {!loading && exercises.map(({ templateExercise, setLogs }) => {
            const completedSets = setLogs.filter((sl) => sl.is_completed);
            return (
              <div key={templateExercise.id} className="space-y-1">
                <p className="text-sm font-semibold text-content-primary">
                  {templateExercise.exercise?.name ?? "Exercise"}
                  {templateExercise.exercise?.muscle_group && (
                    <span className="text-content-muted font-normal text-xs ml-2">
                      {templateExercise.exercise.muscle_group}
                    </span>
                  )}
                </p>

                {completedSets.length === 0 ? (
                  <p className="text-xs text-content-muted pl-1">No sets logged</p>
                ) : (
                  <div className="space-y-0.5">
                    {completedSets.map((sl) => (
                      <div key={sl.id} className="flex items-center gap-3 text-xs text-content-secondary pl-1">
                        <span className="w-8 text-content-muted">Set {sl.set_number}</span>
                        <span className="min-w-[64px]">
                          {sl.weight_used != null
                            ? formatWeight(sl.weight_used, templateExercise.is_bodyweight)
                            : "—"}
                        </span>
                        <span>{sl.reps_completed != null ? `${sl.reps_completed} reps` : "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && exercises.length === 0 && (
            <p className="text-sm text-content-muted text-center py-2">No exercise data recorded.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

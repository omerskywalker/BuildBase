import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SessionLog, WorkoutTemplate, TemplateExercise, SetLog } from "@/lib/types";
import { formatWeight, timeAgo } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

const EFFORT_LABELS: Record<number, string> = { 1: "🔴 Easy", 2: "🟠 Light", 3: "🟡 Solid", 4: "🟢 Hard", 5: "💪 Maxed" };

interface SessionDetailModalProps {
  session: SessionLog & { template?: WorkoutTemplate };
  open: boolean;
  onClose: () => void;
}

export default function SessionDetailModal({ session, open, onClose }: SessionDetailModalProps) {
  const [exercises, setExercises] = useState<Array<{ templateExercise: TemplateExercise; setLogs: SetLog[] }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !session.id || session.id.startsWith("virtual-")) return;
    setLoading(true);
    apiFetch(`/api/sessions/${session.id}/exercises`)
      .then(r => r.json())
      .then((data: { exercises: TemplateExercise[]; setLogs: SetLog[] }) => {
        setExercises(data.exercises.map(te => ({ templateExercise: te, setLogs: data.setLogs.filter(sl => sl.template_exercise_id === te.id) })));
      })
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, [open, session.id]);

  const sessionTitle = session.template?.title ?? `Session ${session.session_number}`;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: "#E8DECE", borderColor: "#C8B99D" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#2C1A10" }}>
            {session.template?.day_label && <span style={{ color: "#988A78", fontSize: 13, fontWeight: 400 }} className="mr-2">Day {session.template.day_label}</span>}
            {sessionTitle}
          </DialogTitle>
          {session.completed_at && <p className="text-xs" style={{ color: "#6B5A48" }}>Completed {timeAgo(session.completed_at)} — {new Date(session.completed_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>}
        </DialogHeader>
        {session.post_session_effort && <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm" style={{ background: "#DDD2BF" }}><span style={{ color: "#6B5A48" }}>Effort:</span><span style={{ fontWeight: 600, color: "#2C1A10" }}>{EFFORT_LABELS[session.post_session_effort]}</span></div>}
        {session.notes && <div className="px-3 py-2 rounded-md text-sm" style={{ background: "#DDD2BF" }}><p style={{ color: "#988A78", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</p><p style={{ color: "#2C1A10" }}>{session.notes}</p></div>}
        <div className="space-y-4">
          {loading && <div className="flex items-center justify-center py-6 text-sm gap-2" style={{ color: "#6B5A48" }}><Loader2 className="w-4 h-4 animate-spin" /> Loading sets…</div>}
          {!loading && exercises.map(({ templateExercise, setLogs }) => (
            <div key={templateExercise.id} className="space-y-1">
              <p className="text-sm font-semibold" style={{ color: "#2C1A10" }}>{templateExercise.exercise?.name ?? "Exercise"}{templateExercise.exercise?.muscle_group && <span className="ml-2 text-xs font-normal" style={{ color: "#988A78" }}>{templateExercise.exercise.muscle_group}</span>}</p>
              {setLogs.filter(sl => sl.is_completed).length === 0 ? <p className="text-xs pl-1" style={{ color: "#988A78" }}>No sets logged</p> : setLogs.filter(sl => sl.is_completed).map(sl => (
                <div key={sl.id} className="flex items-center gap-3 text-xs pl-1" style={{ color: "#6B5A48" }}>
                  <span className="w-8" style={{ color: "#988A78" }}>Set {sl.set_number}</span>
                  <span className="min-w-[64px]">{sl.weight_used != null ? formatWeight(sl.weight_used, templateExercise.is_bodyweight) : "—"}</span>
                  <span>{sl.reps_completed != null ? `${sl.reps_completed} reps` : "—"}</span>
                </div>
              ))}
            </div>
          ))}
          {!loading && exercises.length === 0 && <p className="text-sm text-center py-2" style={{ color: "#988A78" }}>No exercise data recorded.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

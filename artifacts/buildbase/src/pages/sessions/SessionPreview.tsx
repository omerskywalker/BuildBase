import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SessionLog, WorkoutTemplate, TemplateExercise } from "@/lib/types";
import { formatWeight, getDefaultWeight } from "@/lib/utils";
import { Eye, Loader2 } from "lucide-react";

interface SessionPreviewProps {
  session: SessionLog & { template?: WorkoutTemplate };
  open: boolean;
  onClose: () => void;
  userTier: "pre_baseline" | "default" | "post_baseline";
  userGender: "male" | "female" | "other" | "unset";
}

export default function SessionPreview({ session, open, onClose, userTier, userGender }: SessionPreviewProps) {
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !session.workout_template_id) return;
    setLoading(true);
    fetch(`/api/templates/${session.workout_template_id}/exercises`)
      .then(r => r.json())
      .then((data: { exercises: TemplateExercise[] }) => setExercises(data.exercises ?? []))
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, [open, session.workout_template_id]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: "#E8DECE", borderColor: "#C8B99D" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#2C1A10" }}>
            {session.template?.day_label && <span style={{ color: "#988A78", fontSize: 13, fontWeight: 400 }} className="mr-2">Day {session.template.day_label}</span>}
            {session.template?.title ?? `Session ${session.session_number}`}
          </DialogTitle>
          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: "#6B5A48" }}><Eye className="w-3.5 h-3.5" /><span>Preview — default weights for your tier</span></div>
        </DialogHeader>
        <div className="space-y-4">
          {loading && <div className="flex items-center justify-center py-6 text-sm gap-2" style={{ color: "#6B5A48" }}><Loader2 className="w-4 h-4 animate-spin" /> Loading exercises…</div>}
          {!loading && exercises.map(te => (
            <div key={te.id} className="space-y-1">
              <p className="text-sm font-semibold" style={{ color: "#2C1A10" }}>{te.exercise?.name ?? "Exercise"}{te.exercise?.muscle_group && <span className="ml-2 text-xs font-normal" style={{ color: "#988A78" }}>{te.exercise.muscle_group}</span>}</p>
              {te.coaching_cues && <p className="text-xs italic pl-1" style={{ color: "#6B5A48" }}>{te.coaching_cues}</p>}
              <div className="flex items-center gap-3 px-3 text-xs" style={{ color: "#988A78" }}>
                <span className="w-8">Sets</span><span className="min-w-[64px]">Weight</span><span>Reps</span>
              </div>
              <div className="flex items-center gap-3 px-3 text-xs" style={{ color: "#6B5A48" }}>
                <span className="w-8">{te.sets_default}×</span>
                <span className="min-w-[64px]">{formatWeight(getDefaultWeight(te, userTier, userGender), te.is_bodyweight)}</span>
                <span>{te.reps_default} reps</span>
              </div>
            </div>
          ))}
          {!loading && exercises.length === 0 && <p className="text-sm text-center py-2" style={{ color: "#988A78" }}>No exercises assigned to this session.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

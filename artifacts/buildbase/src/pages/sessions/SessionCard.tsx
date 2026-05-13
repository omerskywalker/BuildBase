import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SessionLog, WorkoutTemplate, TemplateExercise, SetLog } from "@/lib/types";
import { getFormBadge } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { ChevronDown, ChevronRight, Play, CheckCircle, Loader2, Eye } from "lucide-react";
import SetRow from "./SetRow";
import EffortPrompt from "./EffortPrompt";
import SorenessPrompt from "./SorenessPrompt";
import SessionDetailModal from "./SessionDetailModal";
import SessionPreview from "./SessionPreview";

interface SessionCardProps {
  session: SessionLog & { template?: WorkoutTemplate };
  autoExpanded?: boolean;
  userTier?: "pre_baseline" | "default" | "post_baseline";
  userGender?: "male" | "female" | "other" | "unset";
  lastCompletedAt?: string | null;
}

interface ExerciseWithSets { templateExercise: TemplateExercise; setLogs: SetLog[]; }

export default function SessionCard({ session, autoExpanded = false, userTier = "default", userGender = "unset", lastCompletedAt = null }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpanded);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [realSessionId, setRealSessionId] = useState<string | null>(session.id.startsWith("virtual-") ? null : session.id);
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [localIsComplete, setLocalIsComplete] = useState(session.is_complete);
  const [showEffortPrompt, setShowEffortPrompt] = useState(false);
  const [sorenessPrompted, setSorenessPrompted] = useState(session.soreness_prompted ?? false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isVirtual = session.id.startsWith("virtual-");
  const sessionLogId = realSessionId;
  const isCompleted = localIsComplete;
  const isStarted = session.started_at !== null || realSessionId !== null;
  const sessionTitle = session.template?.title || `Session ${session.session_number}`;
  const dayLabel = session.template?.day_label || "";

  const fetchExercises = useCallback(async (logId: string) => {
    setLoadingExercises(true);
    try {
      const res = await apiFetch(`/api/sessions/${logId}/exercises`);
      if (!res.ok) return;
      const data = await res.json() as { exercises: TemplateExercise[]; setLogs: SetLog[] };
      setExercises(data.exercises.map(te => ({ templateExercise: te, setLogs: data.setLogs.filter(sl => sl.template_exercise_id === te.id) })));
    } finally { setLoadingExercises(false); }
  }, []);

  useEffect(() => {
    if (isExpanded && sessionLogId && exercises.length === 0) fetchExercises(sessionLogId);
  }, [isExpanded, sessionLogId, exercises.length, fetchExercises]);

  const handleStartSession = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      if (isVirtual && !realSessionId) {
        const res = await apiFetch("/api/sessions", {
          method: "POST",
          body: JSON.stringify({ workout_template_id: session.workout_template_id, enrollment_id: session.enrollment_id, week_number: session.week_number, session_number: session.session_number }),
        });
        if (!res.ok) return;
        const newLog = await res.json() as SessionLog;
        setRealSessionId(newLog.id);
        setIsExpanded(true);
        await fetchExercises(newLog.id);
      } else if (sessionLogId) {
        await apiFetch(`/api/sessions/${sessionLogId}/start`, { method: "POST" });
        setIsExpanded(true);
        await fetchExercises(sessionLogId);
      }
    } finally { setIsStarting(false); }
  };

  const handleCompleteSession = async () => {
    if (!sessionLogId || isCompleting) return;
    setIsCompleting(true);
    try {
      await apiFetch(`/api/sessions/${sessionLogId}/complete`, { method: "POST" });
      setLocalIsComplete(true);
      setShowEffortPrompt(true);
    } finally { setIsCompleting(false); }
  };

  const getStatusInfo = () => {
    if (isCompleted) return { text: "Completed", color: "text-success bg-success/10" };
    if (isStarted) return { text: "In Progress", color: "text-blue-400 bg-blue-500/10" };
    return { text: "Not Started", color: "text-content-secondary bg-bg-hover" };
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <Card className="transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dayLabel && <span className="text-sm font-medium text-content-muted">Day {dayLabel}</span>}
              {dayLabel && <span className="text-content-muted">•</span>}
              <h3 className="text-base font-semibold text-content-primary">{sessionTitle}</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                {isCompleted ? <CheckCircle className="w-3 h-3" /> : isStarted ? <Loader2 className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {statusInfo.text}
              </div>
              {!isCompleted && (
                <button type="button" onClick={() => setShowPreview(true)} className="p-1 rounded hover:bg-bg-hover text-content-muted" title="Preview session">
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {isCompleted && (
                <button type="button" onClick={() => setShowDetailModal(true)} className="text-xs text-accent hover:underline">View details</button>
              )}
              <button type="button" onClick={() => setIsExpanded(v => !v)} className="p-1 rounded hover:bg-bg-hover text-content-muted">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-4">
            {!isCompleted && !isStarted && (
              <SorenessPrompt sessionLogId={sessionLogId ?? ""} lastCompletedAt={lastCompletedAt} sorenessPrompted={sorenessPrompted} onDismiss={() => setSorenessPrompted(true)} />
            )}

            {loadingExercises && <div className="flex items-center justify-center py-4 text-content-secondary text-sm gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading exercises…</div>}

            {!loadingExercises && exercises.length === 0 && !sessionLogId && (
              <div className="text-center py-4">
                <button type="button" onClick={handleStartSession} disabled={isStarting} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-2 mx-auto">
                  {isStarting ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</> : <><Play className="w-4 h-4" /> Start Session</>}
                </button>
              </div>
            )}

            {exercises.map(({ templateExercise, setLogs }) => {
              const formBadge = getFormBadge(templateExercise.form_assessment_status);
              const sets = Array.from({ length: templateExercise.sets_default }, (_, i) => i + 1);
              return (
                <div key={templateExercise.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-content-primary">{templateExercise.exercise?.name ?? "Exercise"}</h4>
                    {templateExercise.exercise?.muscle_group && <span className="text-xs text-content-muted">{templateExercise.exercise.muscle_group}</span>}
                    {formBadge && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">{formBadge}</span>}
                  </div>
                  {templateExercise.coaching_cues && <p className="text-xs text-content-secondary italic pl-1">{templateExercise.coaching_cues}</p>}
                  <div className="space-y-1">
                    {sessionLogId && sets.map(setNum => {
                      const existingLog = setLogs.find(sl => sl.set_number === setNum);
                      return (
                        <SetRow key={setNum} sessionLogId={sessionLogId} templateExercise={templateExercise} setNumber={setNum} tier={userTier} gender={userGender}
                          existingLog={existingLog ? { setLogId: existingLog.id, weight: existingLog.weight_used, reps: existingLog.reps_completed } : undefined} />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {showEffortPrompt && sessionLogId && (
              <EffortPrompt sessionLogId={sessionLogId} onDismiss={() => setShowEffortPrompt(false)} />
            )}

            {sessionLogId && !isCompleted && exercises.length > 0 && (
              <button type="button" onClick={handleCompleteSession} disabled={isCompleting} className="w-full py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {isCompleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Completing…</> : <><CheckCircle className="w-4 h-4" /> Complete Session</>}
              </button>
            )}
          </CardContent>
        )}
      </Card>

      <SessionDetailModal session={session} open={showDetailModal} onClose={() => setShowDetailModal(false)} />
      <SessionPreview session={session} open={showPreview} onClose={() => setShowPreview(false)} userTier={userTier} userGender={userGender} />
    </>
  );
}

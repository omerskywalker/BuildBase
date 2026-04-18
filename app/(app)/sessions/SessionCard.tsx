"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionLog, WorkoutTemplate, TemplateExercise, SetLog } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { ChevronDown, ChevronRight, Play, CheckCircle, Loader2 } from "lucide-react";
import SetRow from "./SetRow";
import EffortPrompt from "./EffortPrompt";
import SorenessPrompt from "./SorenessPrompt";

interface SessionCardProps {
  session: SessionLog & { template?: WorkoutTemplate };
  autoExpanded?: boolean;
  userTier?: "pre_baseline" | "default" | "post_baseline";
  userGender?: "male" | "female" | "other" | "unset";
  /** completed_at of the last OTHER completed session — used to gate the soreness prompt */
  lastCompletedAt?: string | null;
}

interface ExerciseWithSets {
  templateExercise: TemplateExercise;
  setLogs: SetLog[];
}

export default function SessionCard({
  session,
  autoExpanded = false,
  userTier = "default",
  userGender = "unset",
  lastCompletedAt = null,
}: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpanded);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [realSessionId, setRealSessionId] = useState<string | null>(
    session.id.startsWith("virtual-") ? null : session.id
  );
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [localIsComplete, setLocalIsComplete] = useState(session.is_complete);
  const [showEffortPrompt, setShowEffortPrompt] = useState(false);
  const [sorenessPrompted, setSorenessPrompted] = useState(session.soreness_prompted ?? false);

  const isVirtual = session.id.startsWith("virtual-");
  const sessionLogId = realSessionId;
  const isCompleted = localIsComplete;
  const isStarted = session.started_at !== null || realSessionId !== null;
  const sessionTitle = session.template?.title || `Session ${session.session_number}`;
  const dayLabel = session.template?.day_label || "";

  const fetchExercises = useCallback(async (logId: string) => {
    setLoadingExercises(true);
    try {
      const res = await fetch(`/api/sessions/${logId}/exercises`);
      if (!res.ok) return;
      const data = await res.json() as { exercises: TemplateExercise[]; setLogs: SetLog[] };
      const merged: ExerciseWithSets[] = data.exercises.map((te) => ({
        templateExercise: te,
        setLogs: data.setLogs.filter((sl) => sl.template_exercise_id === te.id),
      }));
      setExercises(merged);
    } finally {
      setLoadingExercises(false);
    }
  }, []);

  // Load exercises when expanded and we have a real session ID
  useEffect(() => {
    if (isExpanded && sessionLogId && exercises.length === 0) {
      fetchExercises(sessionLogId);
    }
  }, [isExpanded, sessionLogId, exercises.length, fetchExercises]);

  const handleStartSession = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      if (isVirtual && !realSessionId) {
        // Create the session_log row first
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workout_template_id: session.workout_template_id,
            enrollment_id: session.enrollment_id,
            week_number: session.week_number,
            session_number: session.session_number,
          }),
        });
        if (!res.ok) return;
        const newLog = await res.json() as SessionLog;
        setRealSessionId(newLog.id);
        setIsExpanded(true);
        await fetchExercises(newLog.id);
      } else if (sessionLogId) {
        await fetch(`/api/sessions/${sessionLogId}/start`, { method: "POST" });
        setIsExpanded(true);
        await fetchExercises(sessionLogId);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionLogId || isCompleting) return;
    setIsCompleting(true);
    try {
      await fetch(`/api/sessions/${sessionLogId}/complete`, { method: "POST" });
      setLocalIsComplete(true);
      setShowEffortPrompt(true);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleToggleExpanded = () => {
    setIsExpanded((v) => !v);
  };

  const getStatusInfo = () => {
    if (isCompleted) return { icon: <CheckCircle className="w-4 h-4" />, text: "Completed", color: "text-success bg-success/10" };
    if (isStarted) return { icon: <Loader2 className="w-4 h-4" />, text: "In Progress", color: "text-blue-400 bg-blue-500/10" };
    return { icon: <Play className="w-4 h-4" />, text: "Not Started", color: "text-content-secondary bg-bg-hover" };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-content-muted">Day {dayLabel}</span>
            <span className="text-content-muted">•</span>
            <h3 className="text-base font-semibold text-content-primary">{sessionTitle}</h3>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
              {statusInfo.icon}
              <span>{statusInfo.text}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleExpanded}
              className="h-8 w-8 flex items-center justify-center rounded-md text-content-secondary hover:text-content-primary hover:bg-bg-hover transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isExpanded && (
          <div className="flex items-center justify-between text-xs text-content-muted mt-1">
            <span>{session.template?.description}</span>
            {isCompleted && session.completed_at && <span>Completed {timeAgo(session.completed_at)}</span>}
            {isStarted && !isCompleted && session.started_at && <span>Started {timeAgo(session.started_at)}</span>}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Soreness prompt — fires when gap since last session exceeds threshold */}
          {sessionLogId && !isCompleted && (
            <SorenessPrompt
              sessionLogId={sessionLogId}
              lastCompletedAt={lastCompletedAt ?? null}
              sorenessPrompted={sorenessPrompted}
              onDismiss={() => setSorenessPrompted(true)}
            />
          )}

          {!isStarted && !isCompleted && (
            <Button
              onClick={handleStartSession}
              disabled={isStarting}
              className="w-full bg-accent hover:bg-accent-dim text-white"
            >
              {isStarting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…</>
              ) : (
                "Start Session"
              )}
            </Button>
          )}

          {/* Exercise list */}
          {sessionLogId && (
            <div className="space-y-5">
              {loadingExercises && (
                <div className="flex items-center justify-center py-6 text-content-secondary text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading exercises…
                </div>
              )}

              {!loadingExercises && exercises.map(({ templateExercise, setLogs }) => (
                <div key={templateExercise.id} className="space-y-2">
                  {/* Exercise header */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-content-primary">
                      {templateExercise.exercise?.name ?? "Exercise"}
                    </span>
                    {templateExercise.exercise?.muscle_group && (
                      <span className="text-xs text-content-muted">{templateExercise.exercise.muscle_group}</span>
                    )}
                    {templateExercise.coaching_cues && (
                      <span className="text-xs text-content-secondary italic ml-auto">{templateExercise.coaching_cues}</span>
                    )}
                  </div>

                  {/* Column headers */}
                  <div className="flex items-center gap-3 px-3 text-xs text-content-muted">
                    <span className="w-6 text-center">Set</span>
                    <span className="flex-1">Weight</span>
                    <span className="min-w-[84px] text-center">Reps</span>
                    <span className="w-8" />
                  </div>

                  {/* Set rows */}
                  <div className="space-y-1">
                    {Array.from({ length: templateExercise.sets_default }, (_, i) => {
                      const setNumber = i + 1;
                      const existing = setLogs.find((sl) => sl.set_number === setNumber);
                      return (
                        <SetRow
                          key={`${templateExercise.id}-set-${setNumber}`}
                          sessionLogId={sessionLogId}
                          templateExercise={templateExercise}
                          setNumber={setNumber}
                          tier={userTier}
                          gender={userGender}
                          existingLog={
                            existing
                              ? { setLogId: existing.id, weight: existing.weight_used, reps: existing.reps_completed }
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {!loadingExercises && exercises.length === 0 && (
                <p className="text-sm text-content-muted text-center py-4">No exercises found for this session.</p>
              )}

              {/* Finish Session button — shown when exercises are loaded and session not yet complete */}
              {!loadingExercises && exercises.length > 0 && !isCompleted && (
                <Button
                  onClick={handleCompleteSession}
                  disabled={isCompleting}
                  variant="outline"
                  className="w-full border-success text-success hover:bg-success/10"
                >
                  {isCompleting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finishing…</>
                  ) : (
                    "Finish Session"
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Effort prompt — shown immediately after Finish Session */}
          {showEffortPrompt && sessionLogId && (
            <EffortPrompt
              sessionLogId={sessionLogId}
              onDismiss={() => setShowEffortPrompt(false)}
            />
          )}

          {isCompleted && !showEffortPrompt && (
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-sm text-content-secondary">
              {session.completed_at && <span>Completed {timeAgo(session.completed_at)}</span>}
              {session.post_session_effort && <span>Effort: {session.post_session_effort}/5</span>}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

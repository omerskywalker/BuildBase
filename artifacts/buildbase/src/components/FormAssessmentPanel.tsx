import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { CoachFormAssessment, Exercise, FormAssessmentStatus } from "@/lib/types";
import { Loader2, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface ExerciseWithAssessment extends Exercise { assessment?: CoachFormAssessment; }

const STATUS_CONFIG = {
  needs_cues: { label: "Needs Cues", icon: HelpCircle, color: "#B83020", bgColor: "#FEF2F2" },
  getting_there: { label: "Getting There", icon: AlertTriangle, color: "#C08030", bgColor: "#FFFBEB" },
  locked_in: { label: "Locked In", icon: CheckCircle, color: "#2D7A3A", bgColor: "#F0FDF4" },
} as const;

export default function FormAssessmentPanel({ clientId }: { clientId: string }) {
  const [exercises, setExercises] = useState<ExerciseWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`/api/coach/form-assessment?clientId=${clientId}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setExercises(data.exercises);
      const map: Record<string, string> = {};
      data.exercises.forEach((ex: ExerciseWithAssessment) => { if (ex.assessment?.private_notes) map[ex.id] = ex.assessment.private_notes; });
      setLocalNotes(map);
    } catch { toast.error("Failed to load form assessments"); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (exerciseId: string, status: FormAssessmentStatus) => {
    setSaving(exerciseId);
    try {
      const r = await fetch("/api/coach/form-assessment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, exerciseId, status, privateNotes: localNotes[exerciseId] || null }),
      });
      if (!r.ok) throw new Error();
      const updated = await r.json();
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, assessment: updated.assessment } : ex));
      toast.success("Form assessment updated");
    } catch { toast.error("Failed to save assessment"); }
    finally { setSaving(null); }
  };

  const handleSaveNotes = async (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex?.assessment) return;
    setSaving(exerciseId);
    try {
      const r = await fetch("/api/coach/form-assessment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, exerciseId, status: ex.assessment.status, privateNotes: localNotes[exerciseId] || null }),
      });
      if (!r.ok) throw new Error();
      await fetchData();
      toast.success("Notes saved");
    } catch { toast.error("Failed to save notes"); }
    finally { setSaving(null); }
  };

  if (loading) return (
    <Card><CardHeader><h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Form Assessment</h2></CardHeader>
      <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#6B5A48" }} /><span className="ml-2" style={{ color: "#6B5A48" }}>Loading...</span></div></CardContent></Card>
  );

  if (exercises.length === 0) return (
    <Card><CardHeader><h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Form Assessment</h2></CardHeader>
      <CardContent><p style={{ color: "#988A78" }}>No exercises found for assessment.</p></CardContent></Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Form Assessment</h2>
          <p style={{ fontSize: 14, color: "#988A78" }}>Only "Locked In" shows as "Solid Form ✅" to user</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exercises.map(exercise => {
            const currentStatus = exercise.assessment?.status;
            const statusConfig = currentStatus ? STATUS_CONFIG[currentStatus] : null;
            const isExpanded = expandedNotes.has(exercise.id);
            const isSaving = saving === exercise.id;
            return (
              <div key={exercise.id} className="p-4 rounded-lg border" style={{ borderColor: "#C8B99D", backgroundColor: statusConfig?.bgColor || "#FEFCF8" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2C1A10" }}>{exercise.name}</h3>
                    {exercise.muscle_group && <p style={{ fontSize: 14, color: "#6B5A48", marginTop: 2 }}>{exercise.muscle_group}</p>}
                  </div>
                  {statusConfig && (
                    <Badge variant="secondary" className="flex items-center gap-1" style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color, border: `1px solid ${statusConfig.color}20` }}>
                      <statusConfig.icon className="w-3 h-3" />{statusConfig.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {(["needs_cues", "getting_there", "locked_in"] as FormAssessmentStatus[]).map(status => {
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <Button key={status} variant="outline" size="sm" onClick={() => handleStatusChange(exercise.id, status)} disabled={isSaving}
                        style={{ borderColor: cfg.color, color: currentStatus === status ? "#FEFCF8" : cfg.color, backgroundColor: currentStatus === status ? cfg.color : "transparent" }}>
                        {isSaving && currentStatus === status ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <cfg.icon className="w-3 h-3 mr-1" />}
                        {cfg.label}
                      </Button>
                    );
                  })}
                </div>
                {exercise.assessment && (
                  <div className="space-y-2">
                    <button onClick={() => setExpandedNotes(prev => { const s = new Set(prev); s.has(exercise.id) ? s.delete(exercise.id) : s.add(exercise.id); return s; })} className="text-sm text-left" style={{ color: "#6B5A48" }}>
                      {isExpanded ? "▼" : "▶"} Private Notes
                      {exercise.assessment.private_notes && !isExpanded && <span className="ml-1 text-xs" style={{ color: "#988A78" }}>(has notes)</span>}
                    </button>
                    {isExpanded && (
                      <div className="space-y-2">
                        <Textarea placeholder="Add private coaching notes (not visible to client)..." value={localNotes[exercise.id] || ""} onChange={e => setLocalNotes(prev => ({ ...prev, [exercise.id]: e.target.value }))} className="text-sm" rows={3} />
                        <div className="flex items-center justify-between">
                          <Button variant="outline" size="sm" onClick={() => handleSaveNotes(exercise.id)} disabled={isSaving}>
                            {isSaving ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : "Save Notes"}
                          </Button>
                          {exercise.assessment.updated_at && <span className="text-xs" style={{ color: "#988A78" }}>Last updated: {new Date(exercise.assessment.updated_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

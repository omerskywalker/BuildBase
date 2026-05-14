"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CoachFormAssessment, Exercise, FormAssessmentStatus } from "@/lib/types";
import { Loader2, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface FormAssessmentPanelProps {
  clientId: string;
}

interface ExerciseWithAssessment extends Exercise {
  assessment?: CoachFormAssessment;
}

const STATUS_CONFIG = {
  needs_cues: {
    label: "Needs Cues",
    icon: HelpCircle,
    color: "#B83020",
    bgColor: "#FEF2F2",
  },
  getting_there: {
    label: "Getting There",
    icon: AlertTriangle,
    color: "#C08030",
    bgColor: "#FFFBEB",
  },
  locked_in: {
    label: "Locked In",
    icon: CheckCircle,
    color: "#2D7A3A",
    bgColor: "#F0FDF4",
  },
} as const;

export default function FormAssessmentPanel({ clientId }: FormAssessmentPanelProps) {
  const [exercises, setExercises] = useState<ExerciseWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const fetchExercisesWithAssessments = useCallback(async () => {
    try {
      const res = await fetch(`/api/coach/form-assessment?clientId=${clientId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch form assessments');
      }
      const data = await res.json();
      setExercises(data.exercises);
      
      // Initialize local notes state
      const notesMap: Record<string, string> = {};
      data.exercises.forEach((ex: ExerciseWithAssessment) => {
        if (ex.assessment?.private_notes) {
          notesMap[ex.id] = ex.assessment.private_notes;
        }
      });
      setLocalNotes(notesMap);
    } catch (error) {
      console.error('Error fetching form assessments:', error);
      toast.error('Failed to load form assessments');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchExercisesWithAssessments();
  }, [fetchExercisesWithAssessments]);

  const handleStatusChange = async (exerciseId: string, status: FormAssessmentStatus) => {
    setSaving(exerciseId);
    try {
      const res = await fetch('/api/coach/form-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          exerciseId,
          status,
          privateNotes: localNotes[exerciseId] || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save assessment');
      }

      const updatedAssessment = await res.json();
      
      // Update local state
      setExercises(prev => 
        prev.map(ex => 
          ex.id === exerciseId 
            ? { ...ex, assessment: updatedAssessment.assessment }
            : ex
        )
      );

      toast.success('Form assessment updated');
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    } finally {
      setSaving(null);
    }
  };

  const handleNotesChange = (exerciseId: string, notes: string) => {
    setLocalNotes(prev => ({
      ...prev,
      [exerciseId]: notes,
    }));
  };

  const handleSaveNotes = async (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise?.assessment) return;

    setSaving(exerciseId);
    try {
      const res = await fetch('/api/coach/form-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          exerciseId,
          status: exercise.assessment.status,
          privateNotes: localNotes[exerciseId] || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save notes');
      }

      await fetchExercisesWithAssessments(); // Refresh to get updated timestamps
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(null);
    }
  };

  const toggleNotesExpanded = (exerciseId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Form Assessment</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#6B5A48" }} />
            <span className="ml-2" style={{ color: "#6B5A48" }}>Loading exercises...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Form Assessment</h2>
        </CardHeader>
        <CardContent>
          <p style={{ color: "#988A78" }}>No exercises found for assessment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Form Assessment</h2>
          <p style={{ fontSize: 14, color: "#988A78" }}>
            Mark form status • Only "Locked In" shows as "Solid Form ✅" to user
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exercises.map((exercise) => {
            const currentStatus = exercise.assessment?.status;
            const statusConfig = currentStatus ? STATUS_CONFIG[currentStatus] : null;
            const isExpanded = expandedNotes.has(exercise.id);
            const isSaving = saving === exercise.id;

            return (
              <div 
                key={exercise.id}
                className="p-4 rounded-lg border"
                style={{ 
                  borderColor: "#C8B99D",
                  backgroundColor: statusConfig?.bgColor || "#FEFCF8"
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2C1A10" }}>
                      {exercise.name}
                    </h3>
                    {exercise.muscle_group && (
                      <p style={{ fontSize: 14, color: "#6B5A48", marginTop: 2 }}>
                        {exercise.muscle_group}
                      </p>
                    )}
                  </div>
                  {statusConfig && (
                    <Badge 
                      variant="secondary" 
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor: statusConfig.bgColor,
                        color: statusConfig.color,
                        border: `1px solid ${statusConfig.color}20`
                      }}
                    >
                      <statusConfig.icon className="w-3 h-3" />
                      {statusConfig.label}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(exercise.id, 'needs_cues')}
                    disabled={isSaving}
                    className={currentStatus === 'needs_cues' ? 'ring-2 ring-red-200' : ''}
                    style={{
                      borderColor: "#B83020",
                      color: currentStatus === 'needs_cues' ? "#FEFCF8" : "#B83020",
                      backgroundColor: currentStatus === 'needs_cues' ? "#B83020" : "transparent"
                    }}
                  >
                    {isSaving && currentStatus === 'needs_cues' ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <HelpCircle className="w-3 h-3 mr-1" />
                    )}
                    Needs Cues
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(exercise.id, 'getting_there')}
                    disabled={isSaving}
                    className={currentStatus === 'getting_there' ? 'ring-2 ring-yellow-200' : ''}
                    style={{
                      borderColor: "#C08030",
                      color: currentStatus === 'getting_there' ? "#FEFCF8" : "#C08030",
                      backgroundColor: currentStatus === 'getting_there' ? "#C08030" : "transparent"
                    }}
                  >
                    {isSaving && currentStatus === 'getting_there' ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    Getting There
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(exercise.id, 'locked_in')}
                    disabled={isSaving}
                    className={currentStatus === 'locked_in' ? 'ring-2 ring-green-200' : ''}
                    style={{
                      borderColor: "#2D7A3A",
                      color: currentStatus === 'locked_in' ? "#FEFCF8" : "#2D7A3A",
                      backgroundColor: currentStatus === 'locked_in' ? "#2D7A3A" : "transparent"
                    }}
                  >
                    {isSaving && currentStatus === 'locked_in' ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    Locked In
                  </Button>
                </div>

                {exercise.assessment && (
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleNotesExpanded(exercise.id)}
                      className="text-sm text-left"
                      style={{ color: "#6B5A48" }}
                    >
                      {isExpanded ? '▼' : '▶'} Private Notes
                      {exercise.assessment.private_notes && !isExpanded && (
                        <span className="ml-1 text-xs" style={{ color: "#988A78" }}>
                          (has notes)
                        </span>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add private coaching notes (not visible to client)..."
                          value={localNotes[exercise.id] || ''}
                          onChange={(e) => handleNotesChange(exercise.id, e.target.value)}
                          className="text-sm"
                          rows={3}
                        />
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveNotes(exercise.id)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</>
                            ) : (
                              'Save Notes'
                            )}
                          </Button>
                          {exercise.assessment.updated_at && (
                            <span className="text-xs" style={{ color: "#988A78" }}>
                              Last updated: {new Date(exercise.assessment.updated_at).toLocaleDateString()}
                            </span>
                          )}
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
"use client";

import { useEffect, useState } from "react";
import { 
  Profile, 
  UserEnrollment, 
  Program, 
  Phase, 
  WorkoutTemplate, 
  TemplateExercise, 
  UserExerciseOverride,
  Gender,
  TemplateTier
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Settings, Save, X, Edit, Trash2, Plus } from "lucide-react";
import { getDefaultWeight } from "@/lib/utils";

interface UserProgramData {
  user: Profile;
  enrollment: UserEnrollment & {
    program: Program & {
      phases: (Phase & {
        workout_templates: (WorkoutTemplate & {
          template_exercises: (TemplateExercise & {
            exercise: { id: string; name: string; muscle_group: string | null; };
          })[];
        })[];
      })[];
    };
  };
  overrides: Record<string, UserExerciseOverride>;
}

interface ExerciseOverrideForm {
  template_exercise_id: string;
  sets_override: number | null;
  reps_override: number | null;
  weight_override: number | null;
  notes: string;
}

export function UserOverrideEditor({ userId }: { userId: string }) {
  const [userData, setUserData] = useState<UserProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExerciseOverrideForm>({
    template_exercise_id: "",
    sets_override: null,
    reps_override: null,
    weight_override: null,
    notes: "",
  });

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/overrides/users?user_id=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user program data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (templateExercise: TemplateExercise) => {
    const existingOverride = userData?.overrides[templateExercise.id];
    const defaultWeight = getDefaultWeight(
      templateExercise,
      userData?.user.template_tier as TemplateTier,
      userData?.user.gender as Gender
    );

    setEditingExercise(templateExercise.id);
    setEditForm({
      template_exercise_id: templateExercise.id,
      sets_override: existingOverride?.sets_override || null,
      reps_override: existingOverride?.reps_override || null,
      weight_override: existingOverride?.weight_override || null,
      notes: existingOverride?.notes || "",
    });
  };

  const handleEditCancel = () => {
    setEditingExercise(null);
    setEditForm({
      template_exercise_id: "",
      sets_override: null,
      reps_override: null,
      weight_override: null,
      notes: "",
    });
  };

  const handleEditSave = async () => {
    try {
      const payload = {
        user_id: userId,
        template_exercise_id: editForm.template_exercise_id,
        sets_override: editForm.sets_override,
        reps_override: editForm.reps_override,
        weight_override: editForm.weight_override,
        notes: editForm.notes,
      };

      const response = await fetch("/api/admin/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save override");
      }

      await fetchUserData();
      handleEditCancel();
      toast.success("Override saved successfully");
    } catch (error) {
      console.error("Error saving override:", error);
      toast.error("Failed to save override");
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!confirm("Are you sure you want to remove this override?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/overrides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: overrideId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete override");
      }

      await fetchUserData();
      toast.success("Override removed successfully");
    } catch (error) {
      console.error("Error deleting override:", error);
      toast.error("Failed to remove override");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ color: "#6B5A48" }}>Loading user program data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!userData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            No Program Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ color: "#6B5A48" }}>
            This user is not enrolled in any program or the program data could not be loaded.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { user, enrollment, overrides } = userData;
  const program = enrollment.program;

  // Flatten all exercises from all phases/templates for easier display
  const allExercises: Array<{
    templateExercise: TemplateExercise;
    phase: Phase;
    template: WorkoutTemplate;
    override?: UserExerciseOverride;
  }> = [];

  program.phases.forEach(phase => {
    phase.workout_templates.forEach(template => {
      template.template_exercises.forEach(templateExercise => {
        const override = overrides[templateExercise.id];
        allExercises.push({
          templateExercise,
          phase,
          template,
          override,
        });
      });
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Exercise Overrides
        </CardTitle>
        <CardDescription>
          Program: {program.name} • Week {enrollment.current_week}, Session {enrollment.current_session}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Phase/Session</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Override</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allExercises.map(({ templateExercise, phase, template, override }) => {
              const defaultWeight = getDefaultWeight(
                templateExercise,
                user.template_tier as TemplateTier,
                user.gender as Gender
              );
              const isEditing = editingExercise === templateExercise.id;

              return (
                <TableRow key={templateExercise.id}>
                  <TableCell>
                    <div>
                      <div style={{ fontWeight: 600, color: "#2C1A10" }}>
                        {templateExercise.exercise?.name}
                      </div>
                      {templateExercise.exercise?.muscle_group && (
                        <div style={{ fontSize: 12, color: "#988A78" }}>
                          {templateExercise.exercise.muscle_group}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontSize: 14 }}>
                      <div>{phase.name}</div>
                      <div style={{ color: "#988A78", fontSize: 12 }}>
                        Week {template.week_number} • Day {template.day_label}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontSize: 14, color: "#6B5A48" }}>
                      {templateExercise.sets_default} × {templateExercise.reps_default}
                      {!templateExercise.is_bodyweight && (
                        <> @ {defaultWeight}lbs</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input
                          type="number"
                          placeholder="Sets"
                          value={editForm.sets_override || ""}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            sets_override: e.target.value ? parseInt(e.target.value) : null 
                          })}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          placeholder="Reps"
                          value={editForm.reps_override || ""}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            reps_override: e.target.value ? parseInt(e.target.value) : null 
                          })}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                        {!templateExercise.is_bodyweight && (
                          <>
                            <span>@</span>
                            <input
                              type="number"
                              placeholder="Weight"
                              step="0.5"
                              value={editForm.weight_override || ""}
                              onChange={(e) => setEditForm({ 
                                ...editForm, 
                                weight_override: e.target.value ? parseFloat(e.target.value) : null 
                              })}
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          </>
                        )}
                      </div>
                    ) : override ? (
                      <div style={{ fontSize: 14, color: "#2D7A3A", fontWeight: 600 }}>
                        {override.sets_override || templateExercise.sets_default} × {override.reps_override || templateExercise.reps_default}
                        {!templateExercise.is_bodyweight && (
                          <> @ {override.weight_override || defaultWeight}lbs</>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "#988A78", fontSize: 14 }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-32 px-2 py-1 border rounded text-sm"
                      />
                    ) : override?.notes ? (
                      <span style={{ fontSize: 14, color: "#6B5A48" }}>{override.notes}</span>
                    ) : (
                      <span style={{ color: "#988A78", fontSize: 14 }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: 4 }}>
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleEditSave}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(templateExercise)}
                            className="h-8 w-8 p-0"
                          >
                            {override ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </Button>
                          {override && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteOverride(override.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {allExercises.length === 0 && (
          <div style={{ textAlign: "center", padding: 32, color: "#988A78" }}>
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No exercises found in the user's program</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
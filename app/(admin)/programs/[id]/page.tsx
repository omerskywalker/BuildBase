"use client";

import { useEffect, useState } from "react";
import { Program, Phase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Save, Edit, X, Check, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ProgramWithPhases extends Program {
  phases?: Phase[];
}

export default function ProgramEditorPage() {
  const params = useParams();
  const programId = params.id as string;

  const [program, setProgram] = useState<ProgramWithPhases | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProgram, setEditingProgram] = useState(false);
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    total_phases: 3,
    total_weeks: 12,
  });

  const [phaseForm, setPhaseForm] = useState({
    name: "",
    subtitle: "",
    week_start: 1,
    week_end: 4,
    description: "",
  });

  useEffect(() => {
    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Program not found");
          return;
        }
        throw new Error("Failed to fetch program");
      }
      const data = await response.json();
      setProgram(data);
      setProgramForm({
        name: data.name || "",
        description: data.description || "",
        total_phases: data.total_phases || 3,
        total_weeks: data.total_weeks || 12,
      });
    } catch (error) {
      console.error("Error fetching program:", error);
      toast.error("Failed to load program");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: programId, ...programForm }),
      });

      if (!response.ok) {
        throw new Error("Failed to update program");
      }

      await fetchProgram();
      setEditingProgram(false);
      toast.success("Program updated successfully");
    } catch (error) {
      console.error("Error updating program:", error);
      toast.error("Failed to update program");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase.id);
    setPhaseForm({
      name: phase.name || "",
      subtitle: phase.subtitle || "",
      week_start: phase.week_start || 1,
      week_end: phase.week_end || 4,
      description: phase.description || "",
    });
  };

  const handleSavePhase = async (phaseId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/programs/${programId}/phases`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId, ...phaseForm }),
      });

      if (!response.ok) {
        throw new Error("Failed to update phase");
      }

      await fetchProgram();
      setEditingPhase(null);
      toast.success("Phase updated successfully");
    } catch (error) {
      console.error("Error updating phase:", error);
      toast.error("Failed to update phase");
    } finally {
      setSaving(false);
    }
  };

  const validateWeekRanges = () => {
    if (!program?.phases) return { isValid: true, errors: [] };
    
    const phases = [...program.phases].sort((a, b) => a.phase_number - b.phase_number);
    const errors: string[] = [];
    let expectedStart = 1;

    for (const phase of phases) {
      if (phase.week_start !== expectedStart) {
        errors.push(`Phase ${phase.phase_number} should start at week ${expectedStart}, not ${phase.week_start}`);
      }
      if (phase.week_end < phase.week_start) {
        errors.push(`Phase ${phase.phase_number}: end week (${phase.week_end}) cannot be before start week (${phase.week_start})`);
      }
      expectedStart = phase.week_end + 1;
    }

    const totalWeeksUsed = phases[phases.length - 1]?.week_end || 0;
    if (totalWeeksUsed !== program.total_weeks) {
      errors.push(`Phase weeks (${totalWeeksUsed}) don't match program total (${program.total_weeks})`);
    }

    return { isValid: errors.length === 0, errors };
  };

  const weekValidation = validateWeekRanges();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/admin/programs">
            <Button variant="outline" size="sm" className="mb-4 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Programs
            </Button>
          </Link>
        </div>
        <p style={{ color: "#6B5A48" }}>Loading program...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/admin/programs">
            <Button variant="outline" size="sm" className="mb-4 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Programs
            </Button>
          </Link>
        </div>
        <p style={{ color: "#B83020" }}>Program not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/programs">
          <Button variant="outline" size="sm" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </Button>
        </Link>
        
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
          Edit Program
        </h1>
        <p style={{ color: "#6B5A48", fontSize: 14 }}>
          Manage program details and phase structure
        </p>
      </div>

      {/* Program Details */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <CardTitle>Program Details</CardTitle>
              <CardDescription>Basic information about this workout program</CardDescription>
            </div>
            {!editingProgram ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingProgram(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="sm"
                  onClick={handleSaveProgram}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingProgram(false);
                    setProgramForm({
                      name: program.name || "",
                      description: program.description || "",
                      total_phases: program.total_phases || 3,
                      total_weeks: program.total_weeks || 12,
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <Label htmlFor="name">Program Name</Label>
              {editingProgram ? (
                <Input
                  id="name"
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  placeholder="Enter program name"
                />
              ) : (
                <div style={{ padding: "8px 0", fontSize: 16, fontWeight: 600, color: "#2C1A10" }}>
                  {program.name}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              {editingProgram ? (
                <Textarea
                  id="description"
                  value={programForm.description}
                  onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  placeholder="Enter program description"
                  rows={3}
                />
              ) : (
                <div style={{ padding: "8px 0", color: "#6B5A48" }}>
                  {program.description || <span style={{ fontStyle: "italic", color: "#988A78" }}>No description</span>}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <Label htmlFor="total_phases">Total Phases</Label>
                {editingProgram ? (
                  <Input
                    id="total_phases"
                    type="number"
                    min="1"
                    max="10"
                    value={programForm.total_phases}
                    onChange={(e) => setProgramForm({ ...programForm, total_phases: parseInt(e.target.value) || 3 })}
                  />
                ) : (
                  <div style={{ padding: "8px 0" }}>
                    <Badge variant="secondary">{program.total_phases} phases</Badge>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="total_weeks">Total Weeks</Label>
                {editingProgram ? (
                  <Input
                    id="total_weeks"
                    type="number"
                    min="1"
                    max="52"
                    value={programForm.total_weeks}
                    onChange={(e) => setProgramForm({ ...programForm, total_weeks: parseInt(e.target.value) || 12 })}
                  />
                ) : (
                  <div style={{ padding: "8px 0" }}>
                    <Badge variant="outline">{program.total_weeks} weeks</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Range Validation */}
      {!weekValidation.isValid && (
        <Card style={{ marginBottom: 24, borderColor: "#B83020" }}>
          <CardContent className="pt-6">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <AlertTriangle className="w-5 h-5 text-error mt-0.5" />
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#B83020", marginBottom: 8 }}>
                  Week Range Issues
                </h3>
                <ul style={{ color: "#6B5A48", fontSize: 14 }}>
                  {weekValidation.errors.map((error, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phases */}
      <Card>
        <CardHeader>
          <CardTitle>Phases</CardTitle>
          <CardDescription>
            Configure the phase structure and week ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {program.phases && program.phases.length > 0 ? (
            <div style={{ display: "grid", gap: 16 }}>
              {program.phases
                .sort((a, b) => a.phase_number - b.phase_number)
                .map((phase) => (
                  <Card key={phase.id} style={{ border: "1px solid #C8B99D" }}>
                    <CardHeader className="pb-3">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Badge variant="secondary">Phase {phase.phase_number}</Badge>
                            <Badge variant="outline">Weeks {phase.week_start}–{phase.week_end}</Badge>
                          </div>
                          {editingPhase === phase.id ? (
                            <Input
                              value={phaseForm.name}
                              onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                              placeholder="Phase name"
                              style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}
                            />
                          ) : (
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10" }}>
                              {phase.name}
                            </h3>
                          )}
                          {editingPhase === phase.id ? (
                            <Input
                              value={phaseForm.subtitle}
                              onChange={(e) => setPhaseForm({ ...phaseForm, subtitle: e.target.value })}
                              placeholder="Phase subtitle (optional)"
                              style={{ fontSize: 14, color: "#6B5A48" }}
                            />
                          ) : phase.subtitle ? (
                            <p style={{ fontSize: 14, color: "#6B5A48" }}>{phase.subtitle}</p>
                          ) : null}
                        </div>
                        
                        {editingPhase === phase.id ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button
                              size="sm"
                              onClick={() => handleSavePhase(phase.id)}
                              disabled={saving}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPhase(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPhase(phase)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingPhase === phase.id ? (
                        <div style={{ display: "grid", gap: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <Label htmlFor={`week_start_${phase.id}`}>Start Week</Label>
                              <Input
                                id={`week_start_${phase.id}`}
                                type="number"
                                min="1"
                                value={phaseForm.week_start}
                                onChange={(e) => setPhaseForm({ ...phaseForm, week_start: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`week_end_${phase.id}`}>End Week</Label>
                              <Input
                                id={`week_end_${phase.id}`}
                                type="number"
                                min="1"
                                value={phaseForm.week_end}
                                onChange={(e) => setPhaseForm({ ...phaseForm, week_end: parseInt(e.target.value) || 4 })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`description_${phase.id}`}>Description</Label>
                            <Textarea
                              id={`description_${phase.id}`}
                              value={phaseForm.description}
                              onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                              placeholder="Phase description (optional)"
                              rows={3}
                            />
                          </div>
                        </div>
                      ) : (
                        phase.description && (
                          <p style={{ fontSize: 14, color: "#6B5A48" }}>{phase.description}</p>
                        )
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#6B5A48" }}>
              <p>No phases found for this program.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
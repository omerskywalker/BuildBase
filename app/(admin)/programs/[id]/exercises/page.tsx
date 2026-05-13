'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Eye, Settings } from 'lucide-react';
import type { Exercise, TemplateExercise } from '@/lib/types';

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Glutes',
  'Core',
  'Full Body'
];

export default function ExerciseLibraryPage() {
  const params = useParams();
  const programId = params.id as string;
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedTemplateExercise, setSelectedTemplateExercise] = useState<TemplateExercise | null>(null);
  
  // Form state
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscle_group: '',
    equipment: '',
    instructions: '',
    coaching_cues: '',
    video_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchExercises();
    fetchTemplateExercises();
  }, [searchTerm, muscleGroupFilter, isActiveFilter]);

  const fetchExercises = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (muscleGroupFilter !== 'all') params.append('muscle_group', muscleGroupFilter);
      if (isActiveFilter) params.append('is_active', isActiveFilter);

      const response = await fetch(`/api/admin/exercises?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateExercises = async () => {
    try {
      const response = await fetch('/api/admin/exercises/template-exercises');
      if (response.ok) {
        const data = await response.json();
        setTemplateExercises(data);
      }
    } catch (error) {
      console.error('Error fetching template exercises:', error);
    }
  };

  const handleCreateExercise = async () => {
    try {
      const response = await fetch('/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseForm)
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchExercises();
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const handleUpdateExercise = async () => {
    try {
      const response = await fetch('/api/admin/exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedExercise?.id, ...exerciseForm })
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedExercise(null);
        resetForm();
        fetchExercises();
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    if (!confirm(`Are you sure you want to delete "${exercise.name}"? This will deactivate it if used in templates.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/exercises', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exercise.id })
      });

      if (response.ok) {
        fetchExercises();
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const resetForm = () => {
    setExerciseForm({
      name: '',
      muscle_group: '',
      equipment: '',
      instructions: '',
      coaching_cues: '',
      video_url: '',
      is_active: true
    });
  };

  const openEditModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      muscle_group: exercise.muscle_group || '',
      equipment: exercise.equipment || '',
      instructions: exercise.instructions || '',
      coaching_cues: exercise.coaching_cues || '',
      video_url: exercise.video_url || '',
      is_active: exercise.is_active
    });
    setShowEditModal(true);
  };

  const openWeightModal = (exercise: Exercise) => {
    const templateExercise = templateExercises.find(te => te.exercise_id === exercise.id);
    if (templateExercise) {
      setSelectedTemplateExercise(templateExercise);
      setShowWeightModal(true);
    }
  };

  const getUsageCount = (exerciseId: string) => {
    return templateExercises.filter(te => te.exercise_id === exerciseId).length;
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = searchTerm === '' || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.muscle_group && exercise.muscle_group.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMuscleGroup = muscleGroupFilter === 'all' || exercise.muscle_group === muscleGroupFilter;
    const matchesActive = isActiveFilter === '' || exercise.is_active.toString() === isActiveFilter;
    
    return matchesSearch && matchesMuscleGroup && matchesActive;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
              Exercise Library
            </h1>
            <p style={{ color: "#6B5A48", fontSize: 14 }}>Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
            Exercise Library
          </h1>
          <p style={{ color: "#6B5A48", fontSize: 14 }}>Manage exercises and weight defaults for all program templates</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus size={16} />
          Add Exercise
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search exercises</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="search"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="muscle-group" className="sr-only">Muscle Group</Label>
            <Select
              value={muscleGroupFilter}
              onChange={(e) => setMuscleGroupFilter(e.target.value)}
            >
              <option value="all">All Muscle Groups</option>
              {MUSCLE_GROUPS.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status" className="sr-only">Status</Label>
            <Select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Exercise Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <th className="text-left">Exercise</th>
              <th className="text-left">Muscle Group</th>
              <th className="text-left">Equipment</th>
              <th className="text-left">Status</th>
              <th className="text-left">Usage</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExercises.map((exercise) => (
              <tr key={exercise.id} className="hover:bg-hover">
                <td>
                  <div>
                    <div className="font-medium text-content-primary">{exercise.name}</div>
                    {exercise.instructions && (
                      <div className="text-sm text-content-secondary truncate max-w-xs">
                        {exercise.instructions.slice(0, 60)}{exercise.instructions.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {exercise.muscle_group && (
                    <Badge variant="outline">{exercise.muscle_group}</Badge>
                  )}
                </td>
                <td className="text-content-secondary">
                  {exercise.equipment || '—'}
                </td>
                <td>
                  <Badge variant={exercise.is_active ? "default" : "secondary"}>
                    {exercise.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="text-content-secondary">
                  {getUsageCount(exercise.id)} templates
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    {getUsageCount(exercise.id) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openWeightModal(exercise)}
                        className="gap-1"
                      >
                        <Settings size={14} />
                        Weights
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(exercise)}
                      className="gap-1"
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExercise(exercise)}
                      className="gap-1 text-error hover:text-error"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {filteredExercises.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-content-muted mb-2">No exercises found</div>
            <Button onClick={() => setShowCreateModal(true)} variant="ghost" className="gap-2">
              <Plus size={16} />
              Add your first exercise
            </Button>
          </div>
        )}
      </Card>

      {/* Create/Edit Exercise Modal */}
      {(showCreateModal || showEditModal) && (
        <Dialog open={true} onOpenChange={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedExercise(null);
          resetForm();
        }}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-elevated rounded-lg border border-subtle p-6 w-full max-w-lg">
              <h2 className="text-lg font-bold text-content-primary mb-4">
                {showCreateModal ? 'Add New Exercise' : 'Edit Exercise'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Exercise name"
                  />
                </div>

                <div>
                  <Label htmlFor="muscle-group-form">Muscle Group</Label>
                  <Select
                    value={exerciseForm.muscle_group}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, muscle_group: e.target.value }))}
                  >
                    <option value="">Select muscle group</option>
                    {MUSCLE_GROUPS.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="equipment">Equipment</Label>
                  <Input
                    id="equipment"
                    value={exerciseForm.equipment}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, equipment: e.target.value }))}
                    placeholder="e.g., Barbell, Dumbbells, Bodyweight"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={exerciseForm.instructions}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Step-by-step exercise instructions"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="coaching-cues">Coaching Cues</Label>
                  <Textarea
                    id="coaching-cues"
                    value={exerciseForm.coaching_cues}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, coaching_cues: e.target.value }))}
                    placeholder="Key coaching points and form cues"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input
                    id="video-url"
                    type="url"
                    value={exerciseForm.video_url}
                    onChange={(e) => setExerciseForm(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                {showEditModal && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-active"
                      checked={exerciseForm.is_active}
                      onChange={(e) => setExerciseForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    <Label htmlFor="is-active">Active</Label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedExercise(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={showCreateModal ? handleCreateExercise : handleUpdateExercise}>
                  {showCreateModal ? 'Add Exercise' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Weight Editor Modal - We'll implement this next */}
      {showWeightModal && selectedTemplateExercise && (
        <WeightEditorModal
          templateExercise={selectedTemplateExercise}
          onClose={() => {
            setShowWeightModal(false);
            setSelectedTemplateExercise(null);
          }}
          onSave={() => {
            fetchTemplateExercises();
            setShowWeightModal(false);
            setSelectedTemplateExercise(null);
          }}
        />
      )}
    </div>
  );
}

// Weight Editor Modal Component
interface WeightEditorModalProps {
  templateExercise: TemplateExercise;
  onClose: () => void;
  onSave: () => void;
}

function WeightEditorModal({ templateExercise, onClose, onSave }: WeightEditorModalProps) {
  const [formData, setFormData] = useState({
    sets_default: templateExercise.sets_default,
    reps_default: templateExercise.reps_default,
    weight_pre_baseline_f: templateExercise.weight_pre_baseline_f,
    weight_pre_baseline_m: templateExercise.weight_pre_baseline_m,
    weight_default_f: templateExercise.weight_default_f,
    weight_default_m: templateExercise.weight_default_m,
    weight_post_baseline_f: templateExercise.weight_post_baseline_f,
    weight_post_baseline_m: templateExercise.weight_post_baseline_m,
    is_bodyweight: templateExercise.is_bodyweight,
    superset_group: templateExercise.superset_group || '',
    coaching_cues: templateExercise.coaching_cues || '',
    notes: templateExercise.notes || ''
  });

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/exercises/template-exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateExercise.id, ...formData })
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error updating template exercise:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-elevated rounded-lg border border-subtle p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-bold text-content-primary mb-4">
            Weight Editor: {templateExercise.exercise?.name}
          </h2>
          
          <div className="grid gap-6">
            {/* Sets and Reps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sets">Default Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={formData.sets_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, sets_default: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="reps">Default Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={formData.reps_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, reps_default: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            {/* Weight Defaults Grid */}
            <div>
              <h3 className="font-medium text-content-primary mb-3">Weight Defaults (lbs)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="font-medium text-content-primary mb-2">Pre-Baseline</div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="weight-pre-f" className="text-sm">Female</Label>
                      <Input
                        id="weight-pre-f"
                        type="number"
                        min="0"
                        step="2.5"
                        value={formData.weight_pre_baseline_f}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_pre_baseline_f: parseFloat(e.target.value) || 0 }))}
                        disabled={formData.is_bodyweight}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight-pre-m" className="text-sm">Male</Label>
                      <Input
                        id="weight-pre-m"
                        type="number"
                        min="0"
                        step="2.5"
                        value={formData.weight_pre_baseline_m}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_pre_baseline_m: parseFloat(e.target.value) || 0 }))}
                        disabled={formData.is_bodyweight}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-medium text-content-primary mb-2">Default</div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="weight-default-f" className="text-sm">Female</Label>
                      <Input
                        id="weight-default-f"
                        type="number"
                        min="0"
                        step="2.5"
                        value={formData.weight_default_f}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_default_f: parseFloat(e.target.value) || 0 }))}
                        disabled={formData.is_bodyweight}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight-default-m" className="text-sm">Male</Label>
                      <Input
                        id="weight-default-m"
                        type="number"
                        min="0"
                        step="2.5"
                        value={formData.weight_default_m}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_default_m: parseFloat(e.target.value) || 0 }))}
                        disabled={formData.is_bodyweight}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-medium text-content-primary mb-2">Post-Baseline</div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="weight-post-f" className="text-sm">Female</Label>
                      <Input
                        id="weight-post-f"
                        type="number"
                        min="0"
                        step="2.5"
                        value={formData.weight_post_baseline_f}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_post_baseline_f: parseFloat(e.target.value) || 0 }))}
                        disabled={formData.is_bodyweight}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight-post-m" className="text-sm">Male</Label>
                      <Input
                        id="weight-post-m"
                        type="number"
                        min="0"
                        step="2.5"
                        value={formData.weight_post_baseline_m}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight_post_baseline_m: parseFloat(e.target.value) || 0 }))}
                        disabled={formData.is_bodyweight}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="is-bodyweight"
                    checked={formData.is_bodyweight}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_bodyweight: e.target.checked }))}
                  />
                  <Label htmlFor="is-bodyweight">Bodyweight Exercise</Label>
                </div>
                
                <div>
                  <Label htmlFor="superset">Superset Group</Label>
                  <Input
                    id="superset"
                    value={formData.superset_group}
                    onChange={(e) => setFormData(prev => ({ ...prev, superset_group: e.target.value }))}
                    placeholder="e.g., A1, B2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="exercise-cues">Exercise-Specific Cues</Label>
                  <Textarea
                    id="exercise-cues"
                    value={formData.coaching_cues}
                    onChange={(e) => setFormData(prev => ({ ...prev, coaching_cues: e.target.value }))}
                    placeholder="Specific cues for this template"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="exercise-notes">Notes</Label>
                  <Textarea
                    id="exercise-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Internal notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Weight Settings
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
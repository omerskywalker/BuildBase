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
import { Plus, Search, Edit, Trash2, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetchJson } from '@/lib/api-helpers';
import type { Exercise, TemplateExercise } from '@/lib/types';
import ExerciseFormModal from './ExerciseFormModal';
import WeightEditorModal from './WeightEditorModal';

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

      const data = await apiFetchJson<Exercise[]>(`/api/admin/exercises?${params}`);
      setExercises(data);
    } catch {
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateExercises = async () => {
    try {
      const data = await apiFetchJson<TemplateExercise[]>('/api/admin/exercises/template-exercises');
      setTemplateExercises(data);
    } catch {
      toast.error('Failed to load template exercises');
    }
  };

  const handleCreateExercise = async () => {
    try {
      await apiFetchJson('/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseForm)
      });
      setShowCreateModal(false);
      resetForm();
      fetchExercises();
      toast.success('Exercise created');
    } catch {
      toast.error('Failed to create exercise');
    }
  };

  const handleUpdateExercise = async () => {
    try {
      await apiFetchJson('/api/admin/exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedExercise?.id, ...exerciseForm })
      });
      setShowEditModal(false);
      setSelectedExercise(null);
      resetForm();
      fetchExercises();
      toast.success('Exercise updated');
    } catch {
      toast.error('Failed to update exercise');
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    if (!confirm(`Are you sure you want to delete "${exercise.name}"? This will deactivate it if used in templates.`)) {
      return;
    }

    try {
      await apiFetchJson('/api/admin/exercises', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exercise.id })
      });
      fetchExercises();
      toast.success('Exercise deleted');
    } catch {
      toast.error('Failed to delete exercise');
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
        <ExerciseFormModal
          mode={showCreateModal ? 'create' : 'edit'}
          exerciseForm={exerciseForm}
          onFormChange={setExerciseForm}
          onSubmit={showCreateModal ? handleCreateExercise : handleUpdateExercise}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedExercise(null);
            resetForm();
          }}
          MUSCLE_GROUPS={MUSCLE_GROUPS}
        />
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


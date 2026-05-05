'use client';

import { useState, useOptimistic } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { WorkoutTemplate, TemplateExercise, Exercise } from '@/lib/types';
import { ExerciseItem } from './ExerciseItem';
import { ExerciseLibraryDialog } from './ExerciseLibraryDialog';

interface SessionEditorProps {
  template: WorkoutTemplate & { phase: any };
  templateExercises: (TemplateExercise & { exercise: Exercise })[];
  allExercises: Exercise[];
  programId: string;
}

export function SessionEditor({ template, templateExercises, allExercises, programId }: SessionEditorProps) {
  const router = useRouter();
  const [exercises, setExercises] = useState(templateExercises);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Optimistic updates for drag operations
  const [optimisticExercises, updateOptimisticExercises] = useOptimistic(
    exercises,
    (state, newExercises: typeof exercises) => newExercises
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = exercises.findIndex((ex) => ex.id === active.id);
    const newIndex = exercises.findIndex((ex) => ex.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newExercises = arrayMove(exercises, oldIndex, newIndex).map((ex: (typeof exercises)[number], index: number) => ({
      ...ex,
      order_index: index
    }));
    
    // Optimistic update
    updateOptimisticExercises(newExercises);
    
    try {
      // Update in database
      const response = await fetch(`/api/admin/programs/${programId}/session-editor/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: template.id,
          exercises: newExercises.map(ex => ({ id: ex.id, order_index: ex.order_index }))
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reorder exercises');
      }
      
      setExercises(newExercises);
      toast.success('Exercise order updated');
    } catch (error) {
      console.error('Error reordering exercises:', error);
      toast.error('Failed to reorder exercises');
      // Revert optimistic update
      updateOptimisticExercises(exercises);
    }
  };

  const handleAddExercise = async (exerciseId: string) => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}/session-editor/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: template.id,
          exerciseId,
          orderIndex: exercises.length
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add exercise');
      }
      
      const { templateExercise } = await response.json();
      
      setExercises(prev => [...prev, templateExercise]);
      toast.success('Exercise added to session');
      setIsLibraryOpen(false);
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast.error('Failed to add exercise');
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}/session-editor/exercises/${exerciseId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove exercise');
      }
      
      setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
      toast.success('Exercise removed from session');
    } catch (error) {
      console.error('Error removing exercise:', error);
      toast.error('Failed to remove exercise');
    }
  };

  const handleUpdateExercise = async (exerciseId: string, updates: Partial<TemplateExercise>) => {
    try {
      const response = await fetch(`/api/admin/programs/${programId}/session-editor/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update exercise');
      }
      
      const { templateExercise } = await response.json();
      
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, ...templateExercise } : ex));
      toast.success('Exercise updated');
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast.error('Failed to update exercise');
    }
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      // Save any pending changes (this could be expanded for more session-level edits)
      toast.success('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/programs/${programId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Program
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-content-primary">
            {template.title}
          </h1>
          <p className="text-content-secondary">
            {template.phase?.name} • Week {template.week_number} • Session {template.session_number} ({template.day_label})
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsLibraryOpen(true)}
            className="bg-accent hover:bg-accent-dim text-button-text"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
          <Button
            onClick={handleSaveSession}
            disabled={isSaving}
            className="bg-brand hover:bg-brand/90 text-button-text"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Session'}
          </Button>
        </div>
      </div>

      {/* Session Description */}
      {template.description && (
        <Card className="p-4">
          <p className="text-content-secondary">{template.description}</p>
        </Card>
      )}

      {/* Exercise List */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content-primary">Exercises</h2>
            <p className="text-sm text-content-secondary">
              {optimisticExercises.length} exercise{optimisticExercises.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {optimisticExercises.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-content-secondary mb-4">No exercises in this session yet.</p>
              <Button
                onClick={() => setIsLibraryOpen(true)}
                className="bg-accent hover:bg-accent-dim text-button-text"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Exercise
              </Button>
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={optimisticExercises}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {optimisticExercises.map((templateExercise, index) => (
                    <ExerciseItem
                      key={templateExercise.id}
                      templateExercise={templateExercise}
                      index={index}
                      onRemove={handleRemoveExercise}
                      onUpdate={handleUpdateExercise}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Card>

      {/* Exercise Library Dialog */}
      <ExerciseLibraryDialog
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        exercises={allExercises}
        excludeIds={exercises.map(ex => ex.exercise_id)}
        onAddExercise={handleAddExercise}
      />
    </div>
  );
}
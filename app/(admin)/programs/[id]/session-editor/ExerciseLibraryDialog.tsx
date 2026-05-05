'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import type { Exercise } from '@/lib/types';

interface ExerciseLibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  excludeIds: string[];
  onAddExercise: (exerciseId: string) => void;
}

export function ExerciseLibraryDialog({ 
  isOpen, 
  onClose, 
  exercises, 
  excludeIds, 
  onAddExercise 
}: ExerciseLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');

  // Filter exercises
  const availableExercises = exercises.filter(ex => !excludeIds.includes(ex.id));
  
  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (exercise.muscle_group?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesMuscleGroup = !selectedMuscleGroup || exercise.muscle_group === selectedMuscleGroup;
    return matchesSearch && matchesMuscleGroup;
  });

  // Get unique muscle groups
  const muscleGroups = Array.from(new Set(
    availableExercises
      .map(ex => ex.muscle_group)
      .filter(Boolean)
  )).sort();

  const handleAddExercise = (exerciseId: string) => {
    onAddExercise(exerciseId);
    setSearchQuery('');
    setSelectedMuscleGroup('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Exercise to Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-content-secondary" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
              className="px-3 py-2 bg-bg-surface border border-border-subtle rounded text-sm min-w-[150px]"
            >
              <option value="">All Muscle Groups</option>
              {muscleGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-content-secondary">
                  {searchQuery || selectedMuscleGroup 
                    ? 'No exercises found matching your criteria.' 
                    : 'No exercises available to add.'
                  }
                </p>
              </div>
            ) : (
              filteredExercises.map(exercise => (
                <Card key={exercise.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-content-primary truncate">
                        {exercise.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-content-secondary">
                        {exercise.muscle_group && (
                          <span className="bg-bg-surface px-2 py-1 rounded text-xs">
                            {exercise.muscle_group}
                          </span>
                        )}
                        {exercise.equipment && (
                          <span>{exercise.equipment}</span>
                        )}
                      </div>
                      {exercise.instructions && (
                        <p className="text-sm text-content-secondary mt-1 line-clamp-2">
                          {exercise.instructions}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleAddExercise(exercise.id)}
                      size="sm"
                      className="ml-4 bg-accent hover:bg-accent-dim text-button-text"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="text-sm text-content-secondary pt-2 border-t border-border-subtle">
            Showing {filteredExercises.length} of {availableExercises.length} available exercises
            {excludeIds.length > 0 && (
              <span> ({excludeIds.length} already in session)</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
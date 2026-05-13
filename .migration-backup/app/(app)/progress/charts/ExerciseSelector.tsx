"use client";

import { useState, useEffect } from "react";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
}

interface ExerciseSelectorProps {
  userId: string;
  onExerciseSelect: (exerciseId: string, exerciseName: string) => void;
  selectedExerciseId: string | null;
}

export default function ExerciseSelector({ 
  userId, 
  onExerciseSelect, 
  selectedExerciseId 
}: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExercises() {
      try {
        const response = await fetch(`/api/progress/exercises?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json();
        setExercises(data.exercises || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
        <div className="text-content-secondary text-sm">Loading exercises...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
        <div className="text-error text-sm">Error loading exercises: {error}</div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 text-center">
        <div className="text-content-muted text-sm">
          No exercises with logged sets found. Complete some workouts to see charts.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
      <h3 className="font-display font-semibold text-content-primary mb-3">
        Select Exercise
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {exercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onExerciseSelect(exercise.id, exercise.name)}
            className={`
              w-full text-left px-3 py-2 rounded-md text-sm transition-colors
              ${selectedExerciseId === exercise.id
                ? 'bg-accent bg-opacity-10 border-l-3 border-accent text-content-primary'
                : 'text-content-secondary hover:bg-bg-hover hover:text-content-primary'
              }
            `}
          >
            <div className="font-medium">{exercise.name}</div>
            {exercise.muscle_group && (
              <div className="text-xs text-content-muted mt-1">
                {exercise.muscle_group}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
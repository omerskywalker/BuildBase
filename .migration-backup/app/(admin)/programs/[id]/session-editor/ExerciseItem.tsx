'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { TemplateExercise, Exercise } from '@/lib/types';

interface ExerciseItemProps {
  templateExercise: TemplateExercise & { exercise: Exercise };
  index: number;
  onRemove: (exerciseId: string) => void;
  onUpdate: (exerciseId: string, updates: Partial<TemplateExercise>) => void;
}

export function ExerciseItem({ templateExercise, index, onRemove, onUpdate }: ExerciseItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: templateExercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleFieldUpdate = (field: keyof TemplateExercise, value: any) => {
    onUpdate(templateExercise.id, { [field]: value });
  };

  const getSupersetDisplay = () => {
    if (templateExercise.superset_group) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-info/20 text-info text-xs font-medium rounded">
          Superset {templateExercise.superset_group}
        </span>
      );
    }
    return null;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-all ${isDragging ? 'opacity-50 rotate-2' : ''}`}
    >
      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <button
            className="cursor-grab hover:text-content-primary text-content-secondary p-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-content-secondary bg-bg-surface px-2 py-1 rounded">
                #{index + 1}
              </span>
              {getSupersetDisplay()}
            </div>
            <h3 className="font-semibold text-content-primary truncate">
              {templateExercise.exercise.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-content-secondary">
              <span>{templateExercise.sets_default} sets</span>
              <span>{templateExercise.reps_default} reps</span>
              {templateExercise.is_bodyweight && (
                <span className="text-accent">Bodyweight</span>
              )}
              {templateExercise.is_abs_finisher && (
                <span className="text-warning">Abs Finisher</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(templateExercise.id)}
              className="text-error hover:text-error hover:border-error"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-border-subtle">
            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`sets-${templateExercise.id}`}>Sets</Label>
                <Input
                  id={`sets-${templateExercise.id}`}
                  type="number"
                  min="1"
                  value={templateExercise.sets_default}
                  onChange={(e) => handleFieldUpdate('sets_default', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor={`reps-${templateExercise.id}`}>Reps</Label>
                <Input
                  id={`reps-${templateExercise.id}`}
                  type="number"
                  min="1"
                  value={templateExercise.reps_default}
                  onChange={(e) => handleFieldUpdate('reps_default', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor={`superset-${templateExercise.id}`}>Superset Group</Label>
                <Input
                  id={`superset-${templateExercise.id}`}
                  placeholder="A, B, C, etc."
                  value={templateExercise.superset_group || ''}
                  onChange={(e) => handleFieldUpdate('superset_group', e.target.value || null)}
                />
              </div>
            </div>

            {/* Weight Defaults */}
            <div className="space-y-3">
              <Label>Weight Defaults</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <Label className="text-xs">Pre-baseline Female (lbs)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={templateExercise.weight_pre_baseline_f}
                    onChange={(e) => handleFieldUpdate('weight_pre_baseline_f', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Default Female (lbs)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={templateExercise.weight_default_f}
                    onChange={(e) => handleFieldUpdate('weight_default_f', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Post-baseline Female (lbs)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={templateExercise.weight_post_baseline_f}
                    onChange={(e) => handleFieldUpdate('weight_post_baseline_f', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Pre-baseline Male (lbs)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={templateExercise.weight_pre_baseline_m}
                    onChange={(e) => handleFieldUpdate('weight_pre_baseline_m', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Default Male (lbs)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={templateExercise.weight_default_m}
                    onChange={(e) => handleFieldUpdate('weight_default_m', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Post-baseline Male (lbs)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={templateExercise.weight_post_baseline_m}
                    onChange={(e) => handleFieldUpdate('weight_post_baseline_m', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Flags and Notes */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateExercise.is_bodyweight}
                    onChange={(e) => handleFieldUpdate('is_bodyweight', e.target.checked)}
                    className="rounded border-border-strong"
                  />
                  <span className="text-sm">Bodyweight Exercise</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateExercise.is_abs_finisher}
                    onChange={(e) => handleFieldUpdate('is_abs_finisher', e.target.checked)}
                    className="rounded border-border-strong"
                  />
                  <span className="text-sm">Abs Finisher</span>
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`cues-${templateExercise.id}`}>Coaching Cues</Label>
                <textarea
                  id={`cues-${templateExercise.id}`}
                  className="w-full p-2 text-sm bg-bg-surface border border-border-subtle rounded resize-none"
                  rows={2}
                  placeholder="Exercise-specific coaching cues..."
                  value={templateExercise.coaching_cues || ''}
                  onChange={(e) => handleFieldUpdate('coaching_cues', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${templateExercise.id}`}>Notes</Label>
                <textarea
                  id={`notes-${templateExercise.id}`}
                  className="w-full p-2 text-sm bg-bg-surface border border-border-subtle rounded resize-none"
                  rows={2}
                  placeholder="Additional notes for this exercise..."
                  value={templateExercise.notes || ''}
                  onChange={(e) => handleFieldUpdate('notes', e.target.value || null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
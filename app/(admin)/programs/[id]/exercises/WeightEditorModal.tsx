'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiFetchJson } from '@/lib/api-helpers';
import type { TemplateExercise } from '@/lib/types';

export interface WeightEditorModalProps {
  templateExercise: TemplateExercise;
  onClose: () => void;
  onSave: () => void;
}

export default function WeightEditorModal({ templateExercise, onClose, onSave }: WeightEditorModalProps) {
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
      await apiFetchJson('/api/admin/exercises/template-exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateExercise.id, ...formData })
      });
      onSave();
      toast.success('Weight settings saved');
    } catch {
      toast.error('Failed to save weight settings');
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

'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ExerciseForm {
  name: string;
  muscle_group: string;
  equipment: string;
  instructions: string;
  coaching_cues: string;
  video_url: string;
  is_active: boolean;
}

export interface ExerciseFormModalProps {
  mode: 'create' | 'edit';
  exerciseForm: ExerciseForm;
  onFormChange: (updater: (prev: ExerciseForm) => ExerciseForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  MUSCLE_GROUPS: string[];
}

export default function ExerciseFormModal({
  mode,
  exerciseForm,
  onFormChange,
  onSubmit,
  onClose,
  MUSCLE_GROUPS,
}: ExerciseFormModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-elevated rounded-lg border border-subtle p-6 w-full max-w-lg">
          <h2 className="text-lg font-bold text-content-primary mb-4">
            {mode === 'create' ? 'Add New Exercise' : 'Edit Exercise'}
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={exerciseForm.name}
                onChange={(e) => onFormChange(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Exercise name"
              />
            </div>

            <div>
              <Label htmlFor="muscle-group-form">Muscle Group</Label>
              <Select
                value={exerciseForm.muscle_group}
                onChange={(e) => onFormChange(prev => ({ ...prev, muscle_group: e.target.value }))}
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
                onChange={(e) => onFormChange(prev => ({ ...prev, equipment: e.target.value }))}
                placeholder="e.g., Barbell, Dumbbells, Bodyweight"
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={exerciseForm.instructions}
                onChange={(e) => onFormChange(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Step-by-step exercise instructions"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="coaching-cues">Coaching Cues</Label>
              <Textarea
                id="coaching-cues"
                value={exerciseForm.coaching_cues}
                onChange={(e) => onFormChange(prev => ({ ...prev, coaching_cues: e.target.value }))}
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
                onChange={(e) => onFormChange(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={exerciseForm.is_active}
                  onChange={(e) => onFormChange(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {mode === 'create' ? 'Add Exercise' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

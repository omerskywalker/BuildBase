import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/rbac';
import { SessionEditor } from './SessionEditor';
import type { WorkoutTemplate, TemplateExercise, Exercise } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}

export default async function SessionEditorPage({ params, searchParams }: PageProps) {
  await requireRole(['admin']);
  
  const { id: programId } = await params;
  const { session: sessionId } = await searchParams;
  
  if (!sessionId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-content-primary mb-4">Session Editor</h1>
        <p className="text-content-secondary">Please select a session to edit.</p>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch the workout template with its exercises
  const { data: template, error: templateError } = await supabase
    .from('workout_templates')
    .select(`
      *,
      phase:phases(*)
    `)
    .eq('id', sessionId)
    .single();

  if (templateError || !template) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-content-primary mb-4">Session Editor</h1>
        <p className="text-content-secondary">Session not found.</p>
      </div>
    );
  }

  // Fetch template exercises for this session
  const { data: templateExercises, error: exercisesError } = await supabase
    .from('template_exercises')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('workout_template_id', sessionId)
    .order('order_index', { ascending: true });

  if (exercisesError) {
    console.error('Error fetching template exercises:', exercisesError);
  }

  // Fetch all available exercises for the exercise library
  const { data: allExercises, error: allExercisesError } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (allExercisesError) {
    console.error('Error fetching all exercises:', allExercisesError);
  }

  return (
    <div className="p-8">
      <SessionEditor
        template={template as WorkoutTemplate & { phase: any }}
        templateExercises={(templateExercises || []) as (TemplateExercise & { exercise: Exercise })[]}
        allExercises={(allExercises || []) as Exercise[]}
        programId={programId}
      />
    </div>
  );
}
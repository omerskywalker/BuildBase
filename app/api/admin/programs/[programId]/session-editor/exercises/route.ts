import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    await requireRole(['admin']);
    
    const { programId } = await params;
    const { sessionId, exerciseId, orderIndex } = await request.json();

    if (!sessionId || !exerciseId || typeof orderIndex !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get default exercise data
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Create template exercise with default values
    const { data: templateExercise, error: insertError } = await supabase
      .from('template_exercises')
      .insert({
        workout_template_id: sessionId,
        exercise_id: exerciseId,
        order_index: orderIndex,
        sets_default: 3,
        reps_default: 8,
        weight_pre_baseline_f: 0,
        weight_pre_baseline_m: 0,
        weight_default_f: 0,
        weight_default_m: 0,
        weight_post_baseline_f: 0,
        weight_post_baseline_m: 0,
        is_bodyweight: false,
        is_abs_finisher: false,
      })
      .select(`
        *,
        exercise:exercises(*)
      `)
      .single();

    if (insertError) {
      console.error('Error inserting template exercise:', insertError);
      return NextResponse.json({ error: 'Failed to add exercise' }, { status: 500 });
    }

    return NextResponse.json({ templateExercise });
  } catch (error) {
    console.error('Error adding exercise:', error);
    return NextResponse.json(
      { error: 'Failed to add exercise' },
      { status: 500 }
    );
  }
}
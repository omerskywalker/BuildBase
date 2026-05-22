import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { reorderExercisesSchema } from '@/lib/validations/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    await requireRole(['admin']);

    const { programId } = await params;
    const body = await request.json();
    const parsed = reorderExercisesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { sessionId, exercises } = parsed.data;

    const supabase = await createClient();

    // Update order_index for all exercises in batch
    const updates = exercises.map(async ({ id, order_index }) => {
      const { error } = await supabase
        .from('template_exercises')
        .update({ order_index })
        .eq('id', id);
      
      if (error) throw error;
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering exercises:', error);
    return NextResponse.json(
      { error: 'Failed to reorder exercises' },
      { status: 500 }
    );
  }
}
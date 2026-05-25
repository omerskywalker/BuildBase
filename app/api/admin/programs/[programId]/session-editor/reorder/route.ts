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

    const { exercises } = parsed.data;

    const supabase = await createClient();

    // Use RPC to update all exercise orders in a single database transaction.
    // This prevents partial state if one update fails midway through.
    const { error } = await supabase.rpc('reorder_exercises', {
      exercise_orders: exercises.map(({ id, order_index }) => ({
        id,
        order_index,
      })),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering exercises:', error);
    return NextResponse.json(
      { error: 'Failed to reorder exercises' },
      { status: 500 }
    );
  }
}

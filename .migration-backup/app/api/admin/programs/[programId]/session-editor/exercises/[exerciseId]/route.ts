import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string; exerciseId: string }> }
) {
  try {
    await requireRole(['admin']);
    
    const { exerciseId } = await params;
    const updates = await request.json();

    const supabase = await createClient();

    // Update template exercise
    const { data: templateExercise, error } = await supabase
      .from('template_exercises')
      .update(updates)
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating template exercise:', error);
      return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
    }

    return NextResponse.json({ templateExercise });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string; exerciseId: string }> }
) {
  try {
    await requireRole(['admin']);
    
    const { exerciseId } = await params;
    const supabase = await createClient();

    // Delete template exercise
    const { error } = await supabase
      .from('template_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      console.error('Error deleting template exercise:', error);
      return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}
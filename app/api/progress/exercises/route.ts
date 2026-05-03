import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id; // Allow coaches to view client data

    // Get user's profile to check if requesting user is a coach/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, coach_id')
      .eq('id', user.id)
      .single();

    // Authorization check: users can only see their own data, coaches/admins can see client data
    if (userId !== user.id) {
      if (profile?.role === 'coach') {
        // Verify that the requested user is the coach's client
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('coach_id')
          .eq('id', userId)
          .single();
        
        if (clientProfile?.coach_id !== user.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      } else if (profile?.role !== 'admin') {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Fetch exercises that have completed set logs for this user
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select(`
        id,
        name,
        muscle_group,
        set_logs!inner (
          id,
          session_logs!inner (
            user_id
          )
        )
      `)
      .eq('set_logs.session_logs.user_id', userId)
      .eq('set_logs.is_completed', true)
      .not('set_logs.weight_used', 'is', null)
      .eq('is_active', true);

    if (error) {
      console.error('Exercises fetch error:', error);
      return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
    }

    // Remove duplicates and clean up the data
    const uniqueExercises = exercises
      .reduce((acc: any[], current) => {
        if (!acc.find(ex => ex.id === current.id)) {
          acc.push({
            id: current.id,
            name: current.name,
            muscle_group: current.muscle_group
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ exercises: uniqueExercises });

  } catch (error) {
    console.error('Exercises API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
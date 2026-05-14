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
    const exerciseId = searchParams.get('exerciseId');
    const userId = searchParams.get('userId') || user.id; // Allow coaches to view client data

    if (!exerciseId) {
      return NextResponse.json({ error: "Exercise ID is required" }, { status: 400 });
    }

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

    // Fetch set logs with session data for the specific exercise and user
    const { data: chartData, error } = await supabase
      .from('set_logs')
      .select(`
        weight_used,
        logged_at,
        session_log_id,
        session_logs!inner (
          session_number,
          week_number,
          workout_templates!inner (
            title,
            day_label
          )
        )
      `)
      .eq('exercise_id', exerciseId)
      .eq('session_logs.user_id', userId)
      .eq('is_completed', true)
      .not('weight_used', 'is', null)
      .order('logged_at', { ascending: true });

    if (error) {
      console.error('Chart data fetch error:', error);
      return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
    }

    // Transform data for the chart
    const transformedData = chartData.map((record: any) => ({
      date: new Date(record.logged_at).toLocaleDateString(),
      weight: record.weight_used,
      sessionName: `Week ${record.session_logs.week_number} - ${record.session_logs.workout_templates.title}`,
      rawDate: record.logged_at
    }))
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
    .map(({ rawDate, ...rest }) => rest); // Remove rawDate from final output

    return NextResponse.json({ data: transformedData });

  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
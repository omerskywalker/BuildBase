import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, TrendingUp, Activity } from "lucide-react";
import FormAssessmentPanel from "./FormAssessmentPanel";

interface ClientDetails {
  id: string;
  full_name: string | null;
  email: string;
  gender: string;
  template_tier: string;
  current_week: number;
  current_session: number;
  enrollment_started: string;
  completion_rate: number;
  total_sessions: number;
  completed_sessions: number;
}

interface SessionLogWithTemplate {
  id: string;
  week_number: number;
  session_number: number;
  started_at: string | null;
  completed_at: string | null;
  is_complete: boolean;
  post_session_effort: number | null;
  pre_session_soreness: number | null;
  notes: string | null;
  template: {
    title: string;
    day_label: string;
  };
  set_count: number;
}

interface EffortSorenessData {
  session_number: number;
  effort: number | null;
  soreness: number | null;
  completed_date: string | null;
}

async function getClientDetails(clientId: string, coachId: string): Promise<ClientDetails | null> {
  const supabase = await createClient();

  // Verify this client belongs to this coach
  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name, email, gender, template_tier")
    .eq("id", clientId)
    .eq("coach_id", coachId)
    .single();

  if (!client) return null;

  // Get their active enrollment
  const { data: enrollment } = await supabase
    .from("user_enrollments")
    .select("id, current_week, current_session, started_at")
    .eq("user_id", clientId)
    .eq("is_active", true)
    .single();
    
  if (!enrollment) return null;
  
  // Get completion stats
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select("is_complete, session_number")
    .eq("user_id", clientId)
    .eq("enrollment_id", enrollment.id);

  const totalSessions = Math.min((enrollment.current_week - 1) * 3 + enrollment.current_session - 1, 36);
  const completedSessions = sessionLogs?.filter(log => log.is_complete).length || 0;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return {
    id: client.id,
    full_name: client.full_name,
    email: client.email,
    gender: client.gender,
    template_tier: client.template_tier,
    current_week: enrollment.current_week,
    current_session: enrollment.current_session,
    enrollment_started: enrollment.started_at,
    completion_rate: Math.round(completionRate),
    total_sessions: totalSessions,
    completed_sessions,
  };
}

async function getSessionHistory(clientId: string): Promise<SessionLogWithTemplate[]> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("session_logs")
    .select(`
      id,
      week_number,
      session_number,
      started_at,
      completed_at,
      is_complete,
      post_session_effort,
      pre_session_soreness,
      notes,
      workout_templates(
        title,
        day_label
      )
    `)
    .eq("user_id", clientId)
    .order("session_number", { ascending: false })
    .limit(20); // Last 20 sessions

  if (!sessions) return [];

  // Get set counts for each session
  const sessionsWithSets = await Promise.all(
    sessions.map(async (session) => {
      const { data: sets } = await supabase
        .from("set_logs")
        .select("id")
        .eq("session_log_id", session.id);
        
      return {
        ...session,
        template: session.workout_templates,
        set_count: sets?.length || 0,
      };
    })
  );

  return sessionsWithSets;
}

async function getEffortSorenessData(clientId: string): Promise<EffortSorenessData[]> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("session_logs")
    .select("session_number, post_session_effort, pre_session_soreness, completed_at")
    .eq("user_id", clientId)
    .not("post_session_effort", "is", null)
    .order("session_number")
    .limit(10); // Last 10 sessions with effort data

  return sessions?.map(s => ({
    session_number: s.session_number,
    effort: s.post_session_effort,
    soreness: s.pre_session_soreness,
    completed_date: s.completed_at,
  })) || [];
}

function formatSessionDate(date: string | null): string {
  if (!date) return "Not started";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getEffortLabel(effort: number | null): string {
  if (!effort) return "N/A";
  const labels = {
    1: "🔴 Easy",
    2: "🟡 Light",
    3: "🟠 Moderate",
    4: "🟢 Hard",
    5: "💪 Maxed"
  };
  return labels[effort as keyof typeof labels] || "N/A";
}

function getSorenessLabel(soreness: number | null): string {
  if (!soreness) return "N/A";
  const labels = {
    1: "😄 None",
    2: "🙂 Light",
    3: "😐 Moderate",
    4: "😬 High",
    5: "😵 Severe"
  };
  return labels[soreness as keyof typeof labels] || "N/A";
}

interface ClientStatsProps {
  client: ClientDetails;
}

function ClientStats({ client }: ClientStatsProps) {
  const enrollmentDate = new Date(client.enrollment_started);
  const weeksActive = Math.floor((Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" style={{ color: "#C84B1A" }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6B5A48" }}>Progress</h3>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10" }}>Week {client.current_week}</div>
          <div style={{ fontSize: 14, color: "#988A78" }}>Session {client.current_session}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#2D7A3A" }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6B5A48" }}>Completion</h3>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: client.completion_rate >= 80 ? "#2D7A3A" : client.completion_rate >= 60 ? "#C08030" : "#B83020" }}>
            {client.completion_rate}%
          </div>
          <div style={{ fontSize: 14, color: "#988A78" }}>
            {client.completed_sessions}/{client.total_sessions} sessions
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" style={{ color: "#3060A0" }} />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6B5A48" }}>Active Time</h3>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10" }}>{weeksActive}</div>
          <div style={{ fontSize: 14, color: "#988A78" }}>weeks active</div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SessionHistoryProps {
  sessions: SessionLogWithTemplate[];
}

function SessionHistory({ sessions }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Session History</h2>
        </CardHeader>
        <CardContent>
          <p style={{ color: "#988A78" }}>No sessions logged yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Session History</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: session.is_complete ? "#E8F5E8" : "#FFF8F3" }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: "#2C1A10" 
                  }}>
                    Session {session.session_number} • {session.template?.title}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: "#6B5A48",
                    backgroundColor: "#E8DECE",
                    padding: "2px 6px",
                    borderRadius: "3px"
                  }}>
                    Week {session.week_number} {session.template?.day_label}
                  </span>
                  {session.is_complete && (
                    <span style={{ fontSize: 12, color: "#2D7A3A", fontWeight: 500 }}>✅ Complete</span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span style={{ color: "#6B5A48" }}>
                    {formatSessionDate(session.completed_at || session.started_at)}
                  </span>
                  
                  {session.is_complete && (
                    <>
                      <span style={{ color: "#988A78" }}>
                        {session.set_count} sets logged
                      </span>
                      
                      {session.post_session_effort && (
                        <span style={{ color: "#6B5A48" }}>
                          Effort: {getEffortLabel(session.post_session_effort)}
                        </span>
                      )}
                      
                      {session.pre_session_soreness && (
                        <span style={{ color: "#6B5A48" }}>
                          Soreness: {getSorenessLabel(session.pre_session_soreness)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                {session.notes && (
                  <p style={{ 
                    fontSize: 14, 
                    color: "#6B5A48", 
                    marginTop: 4,
                    fontStyle: "italic"
                  }}>
                    "{session.notes}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface EffortTrendsProps {
  data: EffortSorenessData[];
}

function EffortTrends({ data }: EffortTrendsProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Effort & Soreness Trends</h2>
        </CardHeader>
        <CardContent>
          <p style={{ color: "#988A78" }}>Not enough session data to show trends.</p>
        </CardContent>
      </Card>
    );
  }

  const avgEffort = data.reduce((sum, d) => sum + (d.effort || 0), 0) / data.filter(d => d.effort).length;
  const avgSoreness = data.reduce((sum, d) => sum + (d.soreness || 0), 0) / data.filter(d => d.soreness).length;

  return (
    <Card>
      <CardHeader>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Effort & Soreness Trends</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span style={{ color: "#6B5A48" }}>Average Effort Level:</span>
            <span style={{ fontWeight: 600, color: "#2C1A10" }}>
              {getEffortLabel(Math.round(avgEffort))}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span style={{ color: "#6B5A48" }}>Average Soreness Level:</span>
            <span style={{ fontWeight: 600, color: "#2C1A10" }}>
              {getSorenessLabel(Math.round(avgSoreness))}
            </span>
          </div>
          
          <div className="mt-6">
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2C1A10", marginBottom: 12 }}>Recent Sessions</h3>
            <div className="space-y-2">
              {data.slice(-5).map((session, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span style={{ color: "#6B5A48" }}>Session {session.session_number}:</span>
                  <div className="flex gap-4">
                    <span>E: {getEffortLabel(session.effort)}</span>
                    <span>S: {getSorenessLabel(session.soreness)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Verify user is a coach or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const [client, sessionHistory, effortData] = await Promise.all([
    getClientDetails(id, user.id),
    getSessionHistory(id),
    getEffortSorenessData(id),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            style={{
              borderColor: "#B5A68C",
              color: "#6B5A48",
              backgroundColor: "transparent"
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Clients
          </Button>
        </Link>
        
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: "#2C1A10", 
            fontFamily: "var(--font-display)", 
            marginBottom: 4 
          }}>
            {client.full_name || "Unnamed User"}
          </h1>
          <p style={{ color: "#6B5A48", fontSize: 16 }}>
            {client.email} • {client.template_tier.replace('_', ' ')} tier • {client.gender}
          </p>
        </div>
      </div>
      
      <ClientStats client={client} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionHistory sessions={sessionHistory} />
        <EffortTrends data={effortData} />
      </div>
      
      <FormAssessmentPanel clientId={client.id} />
    </div>
  );
}

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ClientSummary {
  id: string;
  full_name: string | null;
  email: string;
  current_week: number;
  current_session: number;
  last_session_date: string | null;
  completion_rate: number;
  total_sessions: number;
  completed_sessions: number;
}

async function getClients(coachId: string): Promise<ClientSummary[]> {
  const supabase = await createClient();

  // Get clients assigned to this coach
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("coach_id", coachId);

  if (!clients) return [];

  // For each client, calculate their stats
  const clientsWithStats = await Promise.all(
    clients.map(async (client): Promise<ClientSummary | null> => {
      // Get their active enrollment
      const { data: enrollment } = await supabase
        .from("user_enrollments")
        .select("id, current_week, current_session")
        .eq("user_id", client.id)
        .eq("is_active", true)
        .single();
      
      if (!enrollment) {
        return null; // Skip clients without active enrollment
      }
      
      // Get session logs to calculate completion rate and last session
      const { data: sessionLogs } = await supabase
        .from("session_logs")
        .select("completed_at, is_complete, session_number")
        .eq("user_id", client.id)
        .eq("enrollment_id", enrollment.id)
        .order("completed_at", { ascending: false, nullsFirst: false });

      const totalSessions = Math.min((enrollment.current_week - 1) * 3 + enrollment.current_session - 1, 36);
      const completedSessions = sessionLogs?.filter(log => log.is_complete).length || 0;
      const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
      
      const lastSessionDate = sessionLogs?.find(log => log.completed_at)?.completed_at || null;

      return {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        current_week: enrollment.current_week,
        current_session: enrollment.current_session,
        last_session_date: lastSessionDate,
        completion_rate: Math.round(completionRate),
        total_sessions: totalSessions,
        completed_sessions,
      };
    })
  );

  // Filter out null values (clients without enrollment)
  const validClients = clientsWithStats.filter(client => client !== null) as ClientSummary[];

  return validClients.sort((a, b) => {
    // Sort by last activity (most recent first), then by name
    if (a.last_session_date && b.last_session_date) {
      return new Date(b.last_session_date).getTime() - new Date(a.last_session_date).getTime();
    }
    if (a.last_session_date && !b.last_session_date) return -1;
    if (!a.last_session_date && b.last_session_date) return 1;
    
    return (a.full_name || a.email).localeCompare(b.full_name || b.email);
  });
}

function formatLastSession(date: string | null): string {
  if (!date) return "Never";
  
  const now = new Date();
  const sessionDate = new Date(date);
  const diffMs = now.getTime() - sessionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return sessionDate.toLocaleDateString();
}

function getCompletionRateColor(rate: number): string {
  if (rate >= 80) return "#2D7A3A"; // success
  if (rate >= 60) return "#C08030"; // warning  
  return "#B83020"; // error
}

interface ClientsListProps {
  clients: ClientSummary[];
}

function ClientsList({ clients }: ClientsListProps) {
  if (clients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p style={{ color: "#6B5A48", fontSize: 16, marginBottom: 16 }}>No clients assigned yet.</p>
        <p style={{ color: "#988A78", fontSize: 14 }}>
          Clients are assigned by administrators. Contact your admin to get clients assigned to you.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 style={{ 
                    fontSize: 18, 
                    fontWeight: 600, 
                    color: "#2C1A10",
                    fontFamily: "var(--font-display)"
                  }}>
                    {client.full_name || "Unnamed User"}
                  </h3>
                  <span style={{ 
                    fontSize: 14, 
                    color: "#6B5A48",
                    backgroundColor: "#E8DECE",
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }}>
                    Week {client.current_week}, Session {client.current_session}
                  </span>
                </div>
                
                <p style={{ color: "#988A78", fontSize: 14, marginBottom: 8 }}>
                  {client.email}
                </p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span style={{ color: "#6B5A48" }}>Last session: </span>
                    <span style={{ color: "#2C1A10", fontWeight: 500 }}>
                      {formatLastSession(client.last_session_date)}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: "#6B5A48" }}>Completion: </span>
                    <span style={{ 
                      color: getCompletionRateColor(client.completion_rate),
                      fontWeight: 600 
                    }}>
                      {client.completion_rate}%
                    </span>
                    <span style={{ color: "#988A78", marginLeft: 4 }}>  
                      ({client.completed_sessions}/{client.total_sessions})
                    </span>
                  </div>
                </div>
              </div>
              
              <Link href={`/clients/${client.id}`}>
                <Button 
                  variant="outline"
                  style={{
                    borderColor: "#B5A68C",
                    color: "#2C1A10",
                    backgroundColor: "transparent"
                  }}
                  className="hover:bg-bg-hover"
                >
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function ClientsPage() {
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

  const clients = await getClients(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: "#2C1A10", 
            fontFamily: "var(--font-display)", 
            marginBottom: 4 
          }}>
            My Clients
          </h1>
          <p style={{ color: "#6B5A48", fontSize: 16 }}>
            Track your clients' progress and engagement.
          </p>
        </div>
      </div>
      
      <Suspense fallback={
        <Card className="p-8 text-center">
          <p style={{ color: "#6B5A48" }}>Loading clients...</p>
        </Card>
      }>
        <ClientsList clients={clients} />
      </Suspense>
    </div>
  );
}

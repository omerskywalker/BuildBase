import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle, Activity, ChevronRight } from "lucide-react";

interface ClientActivity {
  id: string;
  full_name: string | null;
  email: string;
  last_completed_at: string | null;
  completed_this_week: number;
  total_completed: number;
  days_inactive: number;
}

async function getCoachStats(coachId: string) {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("coach_id", coachId);

  if (!clients || clients.length === 0) {
    return { totalClients: 0, activeThisWeek: 0, needsAttention: 0, avgCompletion: 0, clientActivities: [] };
  }

  const clientIds = clients.map((c) => c.id);

  const { data: allLogs } = await supabase
    .from("session_logs")
    .select("user_id, completed_at, is_complete")
    .in("user_id", clientIds)
    .eq("is_complete", true);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const clientActivities: ClientActivity[] = clients.map((client) => {
    const clientLogs = (allLogs ?? []).filter((l) => l.user_id === client.id);
    const completedThisWeek = clientLogs.filter(
      (l) => l.completed_at && new Date(l.completed_at) >= weekAgo
    ).length;

    const lastCompleted = clientLogs
      .filter((l) => l.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

    const lastCompletedAt = lastCompleted?.completed_at ?? null;
    const daysInactive = lastCompletedAt
      ? Math.floor((now.getTime() - new Date(lastCompletedAt).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    return {
      id: client.id,
      full_name: client.full_name,
      email: client.email,
      last_completed_at: lastCompletedAt,
      completed_this_week: completedThisWeek,
      total_completed: clientLogs.length,
      days_inactive: daysInactive,
    };
  });

  const activeThisWeek = clientActivities.filter((c) => c.completed_this_week > 0).length;
  const needsAttention = clientActivities.filter((c) => c.days_inactive >= 7).length;
  const totalCompleted = clientActivities.reduce((sum, c) => sum + c.total_completed, 0);
  const avgCompletion = clients.length > 0 ? Math.round(totalCompleted / clients.length) : 0;

  clientActivities.sort((a, b) => b.days_inactive - a.days_inactive);

  return {
    totalClients: clients.length,
    activeThisWeek,
    needsAttention,
    avgCompletion,
    clientActivities,
  };
}

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getCoachStats(user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-content-primary font-display">
            Coach Dashboard
          </h1>
          <p className="text-sm text-content-secondary">
            Overview of your client activity
          </p>
        </div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-dim transition-colors"
        >
          All Clients <ChevronRight size={14} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <Users size={18} className="text-brand" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.totalClients}</p>
                <p className="text-xs text-content-secondary">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <Activity size={18} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.activeThisWeek}</p>
                <p className="text-xs text-content-secondary">Active This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.needsAttention}</p>
                <p className="text-xs text-content-secondary">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content-primary">{stats.avgCompletion}</p>
                <p className="text-xs text-content-secondary">Avg Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client activity table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Client Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.clientActivities.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-content-muted mb-3" />
              <p className="text-sm text-content-secondary">No clients assigned yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-[1fr,80px,80px,80px] gap-2 px-3 py-2 text-xs text-content-muted font-medium">
                <span>Client</span>
                <span className="text-center">This Week</span>
                <span className="text-center">Total</span>
                <span className="text-center">Last Active</span>
              </div>

              {stats.clientActivities.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="grid grid-cols-[1fr,80px,80px,80px] gap-2 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate">
                      {client.full_name ?? client.email}
                    </p>
                  </div>
                  <span className="text-sm text-center text-content-secondary">
                    {client.completed_this_week}
                  </span>
                  <span className="text-sm text-center text-content-secondary">
                    {client.total_completed}
                  </span>
                  <span className={`text-xs text-center font-medium ${
                    client.days_inactive >= 7 ? "text-warning" : "text-content-secondary"
                  }`}>
                    {relativeDate(client.last_completed_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

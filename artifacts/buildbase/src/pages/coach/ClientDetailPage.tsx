import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, TrendingUp, Activity } from "lucide-react";
import FormAssessmentPanel from "@/components/FormAssessmentPanel";
import SendNoteDialog from "@/components/SendNoteDialog";
import CoachNotesPanel from "@/components/CoachNotesPanel";
import { EFFORT_LABELS, SORENESS_LABELS } from "@/lib/constants";

interface ClientDetails {
  id: string; full_name: string | null; email: string; gender: string; template_tier: string;
  current_week: number; current_session: number; enrollment_started: string;
  completion_rate: number; total_sessions: number; completed_sessions: number;
}

interface SessionLogItem {
  id: string; week_number: number; session_number: number;
  started_at: string | null; completed_at: string | null; is_complete: boolean;
  post_session_effort: number | null; pre_session_soreness: number | null; notes: string | null;
  template: { title: string; day_label: string } | null; set_count: number;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [sessions, setSessions] = useState<SessionLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteSent, setNoteSent] = useState(0);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/coach/clients/${clientId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/coach/clients/${clientId}/sessions`).then(r => r.ok ? r.json() : []),
    ]).then(([c, s]) => { setClient(c); setSessions(s ?? []); }).catch(() => {}).finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="text-center py-8" style={{ color: "#6B5A48" }}>Loading client details...</div>;
  if (!client) return <div className="text-center py-8" style={{ color: "#B83020" }}>Client not found or access denied.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="sm" className="flex items-center gap-2" style={{ borderColor: "#B5A68C", color: "#6B5A48", backgroundColor: "transparent" }}>
              <ChevronLeft className="w-4 h-4" /> Back to Clients
            </Button>
          </Link>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-display)", marginBottom: 4 }}>{client.full_name || "Unnamed User"}</h1>
            <p style={{ color: "#6B5A48", fontSize: 16 }}>{client.email} • {client.template_tier.replace("_", " ")} tier • {client.gender}</p>
          </div>
        </div>
        <SendNoteDialog clientId={client.id} clientName={client.full_name || "Unnamed User"} onNoteSent={() => setNoteSent(n => n + 1)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Calendar className="w-5 h-5" />, label: "Current Week", value: `Week ${client.current_week}` },
          { icon: <Activity className="w-5 h-5" />, label: "Current Session", value: `Session ${client.current_session}` },
          { icon: <TrendingUp className="w-5 h-5" />, label: "Completion Rate", value: `${client.completion_rate}%` },
          { icon: <Calendar className="w-5 h-5" />, label: "Enrolled", value: fmtDate(client.enrollment_started) },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: "#C84B1A" }}>{stat.icon}<span style={{ fontSize: 12, color: "#6B5A48", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</span></div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#2C1A10" }}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><h2 style={{ fontSize: 20, fontWeight: 600, color: "#2C1A10" }}>Recent Sessions</h2></CardHeader>
        <CardContent>
          {sessions.length === 0 ? <p style={{ color: "#988A78" }}>No sessions logged yet.</p> : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "#C8B99D", backgroundColor: s.is_complete ? "#F0FDF4" : "#F7F3EE" }}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#2C1A10" }}>{s.template?.title ?? `Session ${s.session_number}`}</span>
                      {s.is_complete && <span style={{ fontSize: 11, color: "#2D7A3A", background: "#DCFCE7", padding: "2px 6px", borderRadius: 4 }}>✓ Complete</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span style={{ color: "#6B5A48" }}>{fmtDate(s.completed_at || s.started_at)}</span>
                      {s.is_complete && <><span style={{ color: "#988A78" }}>{s.set_count} sets</span>{s.post_session_effort && <span style={{ color: "#6B5A48" }}>E: {EFFORT_LABELS[s.post_session_effort]?.emoji} {EFFORT_LABELS[s.post_session_effort]?.label}</span>}{s.pre_session_soreness && <span style={{ color: "#6B5A48" }}>S: {SORENESS_LABELS[s.pre_session_soreness]?.emoji} {SORENESS_LABELS[s.pre_session_soreness]?.label}</span>}</>}
                    </div>
                    {s.notes && <p style={{ fontSize: 13, color: "#6B5A48", marginTop: 4, fontStyle: "italic" }}>"{s.notes}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FormAssessmentPanel clientId={client.id} />
      <CoachNotesPanel clientId={client.id} clientName={client.full_name || "Unnamed User"} key={noteSent} />
    </div>
  );
}

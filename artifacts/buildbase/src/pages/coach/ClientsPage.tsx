import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ClientSummary {
  id: string; full_name: string | null; email: string;
  current_week: number; current_session: number;
  last_session_date: string | null; completion_rate: number;
  total_sessions: number; completed_sessions: number;
}

function formatLastSession(d: string | null): string {
  if (!d) return "Never";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return new Date(d).toLocaleDateString();
}

function rateColor(rate: number): string {
  if (rate >= 80) return "#2D7A3A";
  if (rate >= 60) return "#C08030";
  return "#B83020";
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/clients").then(r => r.json()).then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-display)", marginBottom: 4 }}>My Clients</h1>
        <p style={{ color: "#6B5A48", fontSize: 16 }}>Track your clients' progress and engagement.</p>
      </div>

      {loading && <Card><CardContent className="p-8 text-center"><p style={{ color: "#6B5A48" }}>Loading clients...</p></CardContent></Card>}

      {!loading && clients.length === 0 && (
        <Card className="p-8 text-center">
          <p style={{ color: "#6B5A48", fontSize: 16, marginBottom: 16 }}>No clients assigned yet.</p>
          <p style={{ color: "#988A78", fontSize: 14 }}>Clients are assigned by administrators. Contact your admin to get clients assigned to you.</p>
        </Card>
      )}

      {!loading && clients.map(client => (
        <Card key={client.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10", fontFamily: "var(--font-display)" }}>{client.full_name || "Unnamed User"}</h3>
                  <span style={{ fontSize: 14, color: "#6B5A48", backgroundColor: "#E8DECE", padding: "2px 8px", borderRadius: 4 }}>Week {client.current_week}, Session {client.current_session}</span>
                </div>
                <p style={{ color: "#988A78", fontSize: 14, marginBottom: 8 }}>{client.email}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div><span style={{ color: "#6B5A48" }}>Last session: </span><span style={{ color: "#2C1A10", fontWeight: 500 }}>{formatLastSession(client.last_session_date)}</span></div>
                  <div><span style={{ color: "#6B5A48" }}>Completion: </span><span style={{ color: rateColor(client.completion_rate), fontWeight: 600 }}>{client.completion_rate}%</span><span style={{ color: "#988A78", marginLeft: 4 }}>({client.completed_sessions}/{client.total_sessions})</span></div>
                </div>
              </div>
              <Link href={`/clients/${client.id}`}>
                <Button variant="outline" style={{ borderColor: "#B5A68C", color: "#2C1A10", backgroundColor: "transparent" }}>View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

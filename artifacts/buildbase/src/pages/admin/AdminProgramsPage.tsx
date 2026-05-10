import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Settings, Dumbbell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Program, Phase } from "@/lib/types";

interface ProgramWithPhases extends Program { phases?: Phase[]; }

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<ProgramWithPhases[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/programs").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setPrograms).catch(() => toast.error("Failed to load programs")).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10" }}>Program Editor</h1><p style={{ color: "#6B5A48" }}>Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", marginBottom: 4 }}>Program Editor</h1>
        <p style={{ color: "#6B5A48", fontSize: 14 }}>Manage workout programs, exercises, and weight defaults</p>
      </div>

      <Card>
        <CardHeader><CardTitle>All Programs</CardTitle><p style={{ fontSize: 14, color: "#6B5A48" }}>{programs.length} total programs</p></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #C8B99D" }}>
                {["Program Name", "Description", "Phases", "Weeks", "Version", "Status", "Created", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-3" style={{ color: "#6B5A48", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #E8DECE" }}>
                  <td className="py-3 px-3" style={{ fontWeight: 600, color: "#2C1A10" }}>{p.name}</td>
                  <td className="py-3 px-3" style={{ fontSize: 14, color: "#6B5A48", maxWidth: 200 }}>{p.description ? (p.description.length > 80 ? `${p.description.slice(0, 80)}...` : p.description) : <span style={{ fontStyle: "italic", color: "#988A78" }}>No description</span>}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2"><Badge variant="secondary">{p.total_phases}</Badge>{p.phases && p.phases.length > 0 && <span style={{ fontSize: 12, color: "#6B5A48" }}>{p.phases.map(ph => ph.name).join(", ")}</span>}</div>
                  </td>
                  <td className="py-3 px-3"><Badge variant="outline">{p.total_weeks}</Badge></td>
                  <td className="py-3 px-3" style={{ color: "#6B5A48" }}>v{p.version}</td>
                  <td className="py-3 px-3"><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></td>
                  <td className="py-3 px-3" style={{ color: "#6B5A48" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/programs/${p.id}`}><Button size="sm" variant="outline" className="h-8 flex items-center gap-1"><Edit className="h-3 w-3" />Edit</Button></Link>
                      <Link href={`/admin/programs/${p.id}/exercises`}><Button size="sm" variant="outline" className="h-8 flex items-center gap-1"><Dumbbell className="h-3 w-3" />Exercises</Button></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {programs.length === 0 && (
            <div className="text-center py-12"><Settings className="mx-auto mb-4 h-12 w-12 opacity-50" style={{ color: "#988A78" }} /><h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#2C1A10" }}>No Programs Found</h3><p style={{ fontSize: 14, color: "#6B5A48" }}>No workout programs have been created yet.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Save, X, Trash2, UserPlus } from "lucide-react";
import type { Profile, UserRole, TemplateTier } from "@/lib/types";

interface ProfileWithCoach extends Profile { coach?: { id: string; full_name: string; email: string } | null; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileWithCoach[]>([]);
  const [coaches, setCoaches] = useState<ProfileWithCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});

  const fetchUsers = async () => {
    try {
      const r = await fetch("/api/admin/users");
      if (!r.ok) throw new Error();
      const data = await r.json();
      setUsers(data);
      setCoaches(data.filter((u: ProfileWithCoach) => u.role === "coach" || u.role === "admin"));
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (userId: string) => {
    try {
      const r = await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId, ...editForm }) });
      if (!r.ok) throw new Error();
      await fetchUsers(); setEditingUser(null); setEditForm({});
      toast.success("User updated successfully");
    } catch { toast.error("Failed to update user"); }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    try {
      const r = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: userId }) });
      if (!r.ok) throw new Error();
      await fetchUsers(); toast.success("User deactivated");
    } catch { toast.error("Failed to deactivate user"); }
  };

  const roleBadge = (role: UserRole) => ({ admin: "destructive", coach: "secondary", user: "outline" }[role] as "destructive" | "secondary" | "outline");

  if (loading) return <div className="p-6"><h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10" }}>Users</h1><p style={{ color: "#6B5A48" }}>Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", marginBottom: 4 }}>Users</h1>
          <p style={{ color: "#6B5A48", fontSize: 14 }}>Manage user accounts, roles, and coach assignments</p>
        </div>
        <Link href="/admin/users/create"><Button className="flex items-center gap-2"><UserPlus className="w-4 h-4" />Create User</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>All Users</CardTitle><p style={{ fontSize: 14, color: "#6B5A48" }}>{users.length} total users</p></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #C8B99D" }}>
                {["Name", "Email", "Role", "Gender", "Coach", "Tier", "Onboarding", "Created", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-3" style={{ color: "#6B5A48", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: "1px solid #E8DECE" }}>
                  <td className="py-3 px-3">
                    {editingUser === user.id ? <input value={editForm.full_name || ""} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" placeholder="Full name" style={{ borderColor: "#C8B99D", background: "#F7F3EE" }} /> : <span style={{ color: "#2C1A10" }}>{user.full_name || <span style={{ color: "#988A78", fontStyle: "italic" }}>No name</span>}</span>}
                  </td>
                  <td className="py-3 px-3" style={{ color: "#6B5A48" }}>{user.email}</td>
                  <td className="py-3 px-3">
                    {editingUser === user.id ? (
                      <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })} className="px-2 py-1 border rounded text-sm" style={{ borderColor: "#C8B99D", background: "#F7F3EE" }}>
                        {["user", "coach", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : <Badge variant={roleBadge(user.role)}>{user.role}</Badge>}
                  </td>
                  <td className="py-3 px-3" style={{ color: "#6B5A48" }}>{user.gender}</td>
                  <td className="py-3 px-3">
                    {editingUser === user.id ? (
                      <select value={editForm.coach_id || ""} onChange={e => setEditForm({ ...editForm, coach_id: e.target.value || null })} className="px-2 py-1 border rounded text-sm" style={{ borderColor: "#C8B99D", background: "#F7F3EE" }}>
                        <option value="">No coach</option>
                        {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                      </select>
                    ) : <span style={{ color: "#6B5A48" }}>{user.coach?.full_name || user.coach?.email || "—"}</span>}
                  </td>
                  <td className="py-3 px-3">
                    {editingUser === user.id ? (
                      <select value={editForm.template_tier} onChange={e => setEditForm({ ...editForm, template_tier: e.target.value as TemplateTier })} className="px-2 py-1 border rounded text-sm" style={{ borderColor: "#C8B99D", background: "#F7F3EE" }}>
                        {["pre_baseline", "default", "post_baseline"].map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </select>
                    ) : <Badge variant="outline">{user.template_tier.replace("_", " ")}</Badge>}
                  </td>
                  <td className="py-3 px-3"><Badge variant={user.onboarding_done ? "default" : "secondary"}>{user.onboarding_done ? "Done" : "Pending"}</Badge></td>
                  <td className="py-3 px-3" style={{ color: "#6B5A48" }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {editingUser === user.id ? (
                        <><button onClick={() => handleSave(user.id)} className="p-1 rounded hover:bg-green-50 text-green-600"><Save className="w-4 h-4" /></button><button onClick={() => { setEditingUser(null); setEditForm({}); }} className="p-1 rounded hover:bg-gray-50 text-gray-500"><X className="w-4 h-4" /></button></>
                      ) : (
                        <><button onClick={() => { setEditingUser(user.id); setEditForm({ role: user.role, coach_id: user.coach_id, template_tier: user.template_tier, full_name: user.full_name, gender: user.gender }); }} className="p-1 rounded hover:bg-bg-hover" style={{ color: "#6B5A48" }}><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(user.id, user.full_name || user.email)} className="p-1 rounded hover:bg-red-50" style={{ color: "#B83020" }}><Trash2 className="w-4 h-4" /></button></>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Profile, UserRole, TemplateTier, Gender } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Save, X, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";

interface ProfileWithCoach extends Profile {
  coach?: { id: string; full_name: string; email: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileWithCoach[]>([]);
  const [coaches, setCoaches] = useState<ProfileWithCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
      setCoaches(data.filter((user: ProfileWithCoach) => user.role === "coach" || user.role === "admin"));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (user: ProfileWithCoach) => {
    setEditingUser(user.id);
    setEditForm({
      role: user.role,
      coach_id: user.coach_id,
      template_tier: user.template_tier,
      full_name: user.full_name,
      gender: user.gender,
    });
  };

  const handleEditCancel = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleEditSave = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...editForm }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      await fetchUsers();
      setEditingUser(null);
      setEditForm({});
      toast.success("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}? This will downgrade their role and remove coach assignments.`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate user");
      }

      await fetchUsers();
      toast.success("User deactivated successfully");
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin": return "destructive";
      case "coach": return "secondary";
      case "user": return "outline";
      default: return "outline";
    }
  };

  const getTierBadgeVariant = (tier: TemplateTier) => {
    switch (tier) {
      case "pre_baseline": return "outline";
      case "default": return "secondary";
      case "post_baseline": return "default";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 16 }}>
          Users
        </h1>
        <p style={{ color: "#6B5A48" }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
            Users
          </h1>
          <p style={{ color: "#6B5A48", fontSize: 14 }}>
            Manage user accounts, roles, and coach assignments
          </p>
        </div>
        <Link href="/admin/users/create">
          <Button className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users.length} total users • Click edit to modify roles and assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Template Tier</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editForm.full_name || ""}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Full name"
                      />
                    ) : (
                      user.full_name || <span style={{ color: "#988A78", fontStyle: "italic" }}>No name</span>
                    )}
                  </TableCell>
                  <TableCell style={{ fontSize: 14 }}>{user.email}</TableCell>
                  <TableCell>
                    {editingUser === user.id ? (
                      <Select
                        value={editForm.role || user.role}
                        onValueChange={(value) => setEditForm({ ...editForm, role: value as UserRole })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUser === user.id ? (
                      <Select
                        value={editForm.gender || user.gender}
                        onValueChange={(value) => setEditForm({ ...editForm, gender: value as Gender })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset">Unset</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span style={{ fontSize: 14, color: user.gender === "unset" ? "#988A78" : "#2C1A10" }}>
                        {user.gender === "unset" ? "—" : user.gender}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUser === user.id ? (
                      <Select
                        value={editForm.coach_id || user.coach_id || "none"}
                        onValueChange={(value) => setEditForm({ ...editForm, coach_id: value === "none" ? null : value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No coach</SelectItem>
                          {coaches.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id}>
                              {coach.full_name || coach.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : user.coach ? (
                      <span style={{ fontSize: 14 }}>{user.coach.full_name || user.coach.email}</span>
                    ) : (
                      <span style={{ color: "#988A78", fontSize: 14 }}>No coach</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUser === user.id ? (
                      <Select
                        value={editForm.template_tier || user.template_tier}
                        onValueChange={(value) => setEditForm({ ...editForm, template_tier: value as TemplateTier })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pre_baseline">Pre baseline</SelectItem>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="post_baseline">Post baseline</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getTierBadgeVariant(user.template_tier)}>
                        {user.template_tier.replace("_", " ")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.onboarding_done ? "secondary" : "outline"}>
                      {user.onboarding_done ? "Done" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: 14, color: "#6B5A48" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: 8 }}>
                      {editingUser === user.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(user.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user.id, user.full_name || user.email)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

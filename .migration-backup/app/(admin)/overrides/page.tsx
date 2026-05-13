"use client";

import { useEffect, useState } from "react";
import { Profile, UserEnrollment, Program, UserExerciseOverride } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Users, Settings } from "lucide-react";
import { UserOverrideEditor } from "./user-override-editor";

interface ProfileWithCoach extends Profile {
  coach?: { id: string; full_name: string; email: string } | null;
}

export default function OverridesPage() {
  const [users, setUsers] = useState<ProfileWithCoach[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
      // Only include users with user role for overrides
      setUsers(data.filter((user: ProfileWithCoach) => user.role === "user"));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 16 }}>
          Workout Overrides
        </h1>
        <p style={{ color: "#6B5A48" }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
          Workout Overrides
        </h1>
        <p style={{ color: "#6B5A48", fontSize: 14 }}>
          Customize sets, reps, and weight for individual users
        </p>
      </div>

      <div style={{ display: "grid", gap: 24, gridTemplateColumns: selectedUserId ? "320px 1fr" : "1fr" }}>
        {/* User Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select User
            </CardTitle>
            <CardDescription>
              Choose a user to manage their workout overrides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ marginBottom: 16 }}>
              <Select
                value={selectedUserId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                className="w-full"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </Select>
            </div>

            {selectedUser && (
              <div style={{ padding: 16, backgroundColor: "#E8DECE", borderRadius: 8, border: "1px solid #C8B99D" }}>
                <div style={{ marginBottom: 8 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: "#2C1A10", marginBottom: 4 }}>
                    {selectedUser.full_name || "No name"}
                  </h4>
                  <p style={{ fontSize: 14, color: "#6B5A48" }}>
                    {selectedUser.email}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Badge variant="outline">
                    {selectedUser.gender === "unset" ? "Gender unset" : selectedUser.gender}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedUser.template_tier.replace("_", " ")}
                  </Badge>
                  {selectedUser.coach && (
                    <Badge variant="outline">
                      Coach: {selectedUser.coach.full_name || selectedUser.coach.email}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {users.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, color: "#988A78" }}>
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Override Editor Panel */}
        {selectedUserId && (
          <UserOverrideEditor userId={selectedUserId} />
        )}
      </div>
    </div>
  );
}
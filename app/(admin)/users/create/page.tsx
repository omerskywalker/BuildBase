"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import type { UserRole, Gender, TemplateTier } from "@/lib/types";

interface CoachOption {
  id: string;
  full_name: string | null;
  email: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    gender: "unset" as Gender,
    role: "user" as UserRole,
    coach_id: "",
    template_tier: "default" as TemplateTier,
  });

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        const coachList = data.filter(
          (u: any) => u.role === "coach" || u.role === "admin"
        );
        setCoaches(coachList);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        coach_id: form.coach_id || null,
      };

      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create user");
        return;
      }

      toast.success("User created successfully");
      router.push("/admin/users");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 mb-6"
        style={{ color: "#6B5A48", fontSize: 14, textDecoration: "none" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: "#C84B1A" }} />
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                disabled={submitting}
              >
                <option value="unset">Unset</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                disabled={submitting}
              >
                <option value="user">User</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach">Coach Assignment</Label>
              <Select
                id="coach"
                value={form.coach_id || "none"}
                onChange={(e) =>
                  setForm({ ...form, coach_id: e.target.value === "none" ? "" : e.target.value })
                }
                disabled={submitting}
              >
                <option value="none">No coach</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || c.email}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Template Tier</Label>
              <Select
                id="tier"
                value={form.template_tier}
                onChange={(e) =>
                  setForm({ ...form, template_tier: e.target.value as TemplateTier })
                }
                disabled={submitting}
              >
                <option value="pre_baseline">Pre-Baseline (Beginner)</option>
                <option value="default">Default (Intermediate)</option>
                <option value="post_baseline">Post-Baseline (Advanced)</option>
              </Select>
              <p className="text-xs" style={{ color: "#988A78" }}>
                Determines starting weights for workout templates.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Creating..." : "Create User"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

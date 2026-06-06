"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiFetchJson } from "@/lib/api-helpers";
import { toast } from "sonner";
import { User, Palette, Shield } from "lucide-react";
import type { Gender, TemplateTier, UserRole } from "@/lib/types";

interface SettingsFormProps {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    role: UserRole;
    gender: Gender;
    template_tier: TemplateTier;
    coach_id: string | null;
  };
}

const TIER_LABELS: Record<TemplateTier, string> = {
  pre_baseline: "Pre-Baseline",
  default: "Default",
  post_baseline: "Post-Baseline",
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "unset", label: "Prefer not to say" },
];

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type ThemePreference = (typeof THEME_OPTIONS)[number]["value"];

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export default function SettingsForm({ profile }: SettingsFormProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [theme, setTheme] = useState<ThemePreference>(getStoredTheme);
  const [saving, setSaving] = useState(false);

  function handleThemeChange(value: ThemePreference) {
    setTheme(value);
    localStorage.setItem("theme", value);
    // Dispatch storage event so ThemeToggle picks it up
    window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetchJson("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, gender }),
      });
      toast.success("Settings saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save settings";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-content-muted">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-content-muted">Role is assigned by an administrator</p>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <RadioGroup
              value={theme}
              onValueChange={(v) => handleThemeChange(v as ThemePreference)}
              className="flex gap-4"
            >
              {THEME_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`theme-${opt.value}`} />
                  <Label htmlFor={`theme-${opt.value}`} className="font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template_tier">Template Tier</Label>
            <Input
              id="template_tier"
              value={TIER_LABELS[profile.template_tier]}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-content-muted">Template tier is set by your coach or admin</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, gender, template_tier, coach_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-content-primary font-display mb-1">
        Settings
      </h1>
      <p className="text-sm text-content-secondary mb-6">
        Manage your profile and preferences
      </p>
      <SettingsForm profile={profile} />
    </div>
  );
}

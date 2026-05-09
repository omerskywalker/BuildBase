"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Gender, TemplateTier } from "@/lib/types";

const VALID_GENDERS: Gender[] = ["male", "female", "other", "unset"];
const VALID_TIERS: TemplateTier[] = ["pre_baseline", "default", "post_baseline"];

export interface OnboardingData {
  full_name: string;
  gender: string;
  template_tier: string;
}

export async function completeOnboarding(data: OnboardingData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const full_name = data.full_name.trim();

  if (!full_name) {
    throw new Error("Full name is required");
  }

  if (!VALID_GENDERS.includes(data.gender as Gender)) {
    throw new Error("Invalid gender");
  }

  if (!VALID_TIERS.includes(data.template_tier as TemplateTier)) {
    throw new Error("Invalid template tier");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name,
      gender: data.gender,
      template_tier: data.template_tier,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    throw new Error(`Failed to complete onboarding: ${profileError.message}`);
  }

  // Enroll user in the active program so Sessions/Progress pages work
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!program) {
    throw new Error("No active program found. Please contact support.");
  }

  const { error: enrollmentError } = await supabase
    .from("user_enrollments")
    .insert({
      user_id: user.id,
      program_id: program.id,
      template_tier: data.template_tier,
      gender_applied: data.gender,
    });

  if (enrollmentError) {
    throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
  }

  redirect("/dashboard");
}

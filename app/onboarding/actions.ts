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

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      gender: data.gender,
      template_tier: data.template_tier,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Failed to complete onboarding: ${error.message}`);
  }

  redirect("/dashboard");
}

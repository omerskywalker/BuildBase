"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Gender, TemplateTier } from "@/lib/types"

export interface OnboardingData {
  full_name: string
  gender: Gender
  template_tier: TemplateTier
}

export async function completeOnboarding(data: OnboardingData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Update profile with onboarding data
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name.trim(),
      gender: data.gender,
      template_tier: data.template_tier,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    console.error("Error completing onboarding:", error)
    throw new Error("Failed to complete onboarding")
  }

  // Redirect to dashboard
  redirect("/dashboard")
}
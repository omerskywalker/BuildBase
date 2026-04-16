"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { completeOnboarding } from "@/lib/actions/onboarding"
import type { Gender, TemplateTier } from "@/lib/types"

export default function OnboardingForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    gender: "unset" as Gender,
    template_tier: "default" as TemplateTier,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.full_name.trim()) {
      setError("Please enter your full name")
      return
    }

    if (formData.gender === "unset") {
      setError("Please select your gender")
      return
    }

    setIsSubmitting(true)
    try {
      await completeOnboarding(formData)
    } catch (error) {
      console.error("Onboarding error:", error)
      setError("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Enter your full name"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select
          id="gender"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
          disabled={isSubmitting}
          required
        >
          <option value="unset" disabled>
            Select your gender
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template_tier">Training Level</Label>
        <Select
          id="template_tier"
          value={formData.template_tier}
          onChange={(e) => setFormData({ ...formData, template_tier: e.target.value as TemplateTier })}
          disabled={isSubmitting}
          required
        >
          <option value="pre_baseline">Pre-Baseline (Beginner)</option>
          <option value="default">Default (Intermediate)</option>
          <option value="post_baseline">Post-Baseline (Advanced)</option>
        </Select>
        <p className="text-xs text-content-muted mt-1">
          This determines your starting weights and program progression.
        </p>
      </div>

      {error && (
        <div className="text-sm text-error bg-error/10 border border-error/20 rounded-md p-3">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Setting up your account..." : "Complete Setup"}
      </Button>
    </form>
  )
}
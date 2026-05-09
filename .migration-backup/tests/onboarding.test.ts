import { describe, it, expect, vi, beforeEach } from 'vitest'
import { completeOnboarding } from '@/app/onboarding/actions'
import type { OnboardingData } from '@/app/onboarding/actions'

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Per-table mock chains
const mockProfileEq = vi.fn()
const mockProfileUpdate = vi.fn()

const mockProgramSingle = vi.fn()
const mockProgramLimit = vi.fn()
const mockProgramEq = vi.fn()
const mockProgramSelect = vi.fn()

const mockEnrollmentInsert = vi.fn()

const mockAuth = {
  getUser: vi.fn()
}

const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') return { update: mockProfileUpdate }
  if (table === 'programs') return { select: mockProgramSelect }
  if (table === 'user_enrollments') return { insert: mockEnrollmentInsert }
  return {}
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: mockAuth,
    from: mockFrom
  }))
}))

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // profiles: .update(...).eq(...)
    mockProfileEq.mockReturnValue({ error: null })
    mockProfileUpdate.mockReturnValue({ eq: mockProfileEq })

    // programs: .select("id").eq(...).limit(1).single()
    mockProgramSingle.mockResolvedValue({ data: { id: 'program-abc' } })
    mockProgramLimit.mockReturnValue({ single: mockProgramSingle })
    mockProgramEq.mockReturnValue({ limit: mockProgramLimit })
    mockProgramSelect.mockReturnValue({ eq: mockProgramEq })

    // user_enrollments: .insert(...)
    mockEnrollmentInsert.mockResolvedValue({ error: null })
  })

  describe('completeOnboarding', () => {
    it('should successfully update profile and create enrollment', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const onboardingData: OnboardingData = {
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default'
      }

      await completeOnboarding(onboardingData)

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockProfileUpdate).toHaveBeenCalledWith({
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default',
        onboarding_done: true,
        updated_at: expect.any(String)
      })
      expect(mockProfileEq).toHaveBeenCalledWith('id', 'user-123')

      expect(mockFrom).toHaveBeenCalledWith('programs')
      expect(mockProgramSelect).toHaveBeenCalledWith('id')
      expect(mockProgramEq).toHaveBeenCalledWith('is_active', true)

      expect(mockFrom).toHaveBeenCalledWith('user_enrollments')
      expect(mockEnrollmentInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        program_id: 'program-abc',
        template_tier: 'default',
        gender_applied: 'male',
      })
    })

    it('should throw error when user not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const onboardingData: OnboardingData = {
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default'
      }

      await expect(completeOnboarding(onboardingData)).rejects.toThrow('User not authenticated')
    })

    it('should throw error when profile update fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      mockProfileEq.mockReturnValue({
        error: { message: 'Database error' }
      })

      const onboardingData: OnboardingData = {
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default'
      }

      await expect(completeOnboarding(onboardingData)).rejects.toThrow('Failed to complete onboarding')
    })

    it('should throw error when no active program exists', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      mockProgramSingle.mockResolvedValue({ data: null })

      const onboardingData: OnboardingData = {
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default'
      }

      await expect(completeOnboarding(onboardingData)).rejects.toThrow('No active program found')
    })

    it('should throw error when enrollment insert fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      mockEnrollmentInsert.mockResolvedValue({
        error: { message: 'Enrollment error' }
      })

      const onboardingData: OnboardingData = {
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default'
      }

      await expect(completeOnboarding(onboardingData)).rejects.toThrow('Failed to create enrollment')
    })

    it('should trim whitespace from full_name', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const onboardingData: OnboardingData = {
        full_name: '  John Doe  ',
        gender: 'female',
        template_tier: 'pre_baseline'
      }

      await completeOnboarding(onboardingData)

      expect(mockProfileUpdate).toHaveBeenCalledWith({
        full_name: 'John Doe',
        gender: 'female',
        template_tier: 'pre_baseline',
        onboarding_done: true,
        updated_at: expect.any(String)
      })
    })

    it('should handle all valid gender options', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const genderOptions = ['male', 'female', 'other'] as const

      for (const gender of genderOptions) {
        const onboardingData: OnboardingData = {
          full_name: 'Test User',
          gender,
          template_tier: 'default'
        }

        await completeOnboarding(onboardingData)

        expect(mockProfileUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ gender })
        )
      }
    })

    it('should handle all valid template_tier options', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const templateTiers = ['pre_baseline', 'default', 'post_baseline'] as const

      for (const template_tier of templateTiers) {
        const onboardingData: OnboardingData = {
          full_name: 'Test User',
          gender: 'male',
          template_tier
        }

        await completeOnboarding(onboardingData)

        expect(mockProfileUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ template_tier })
        )
      }
    })
  })
})
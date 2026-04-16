import { describe, it, expect, vi, beforeEach } from 'vitest'
import { completeOnboarding } from '@/app/onboarding/actions'
import type { OnboardingData } from '@/app/onboarding/actions'

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock Supabase client
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()
const mockAuth = {
  getUser: vi.fn()
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: mockAuth,
    from: mockFrom
  }))
}))

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock chain
    mockEq.mockReturnValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })
  })

  describe('completeOnboarding', () => {
    it('should successfully update profile with valid data', async () => {
      // Mock authenticated user
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
      expect(mockUpdate).toHaveBeenCalledWith({
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default',
        onboarding_done: true,
        updated_at: expect.any(String)
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123')
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

    it('should throw error when database update fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      // Mock database error
      mockEq.mockReturnValue({ 
        error: { message: 'Database error' } 
      })

      const onboardingData: OnboardingData = {
        full_name: 'John Doe',
        gender: 'male',
        template_tier: 'default'
      }

      await expect(completeOnboarding(onboardingData)).rejects.toThrow('Failed to complete onboarding')
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

      expect(mockUpdate).toHaveBeenCalledWith({
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

        expect(mockUpdate).toHaveBeenCalledWith(
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

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ template_tier })
        )
      }
    })
  })
})
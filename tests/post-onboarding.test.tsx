import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import GettingStartedCard from '@/components/GettingStartedCard'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const React = require('react')
    return React.createElement('a', { href }, children)
  },
}))

// ── Supabase mock setup ──────────────────────────────────────────────────────

const mockGetUser = vi.fn()

const mockProfileSingle = vi.fn()
const mockProfileEq = vi.fn()
const mockProfileSelect = vi.fn()

const mockEnrollmentSingle = vi.fn()
const mockEnrollmentEqActive = vi.fn()
const mockEnrollmentEqUser = vi.fn()
const mockEnrollmentSelect = vi.fn()

const mockEnrollInsert = vi.fn()

const mockProgramSingle = vi.fn()
const mockProgramLimit = vi.fn()
const mockProgramEq = vi.fn()
const mockProgramSelect = vi.fn()

const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') {
    return {
      select: mockProfileSelect,
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ error: null }),
      }),
    }
  }
  if (table === 'user_enrollments') {
    return {
      select: mockEnrollmentSelect,
      insert: mockEnrollInsert,
    }
  }
  if (table === 'programs') return { select: mockProgramSelect }
  return {}
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

describe('Post-onboarding dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })

    // Default profile chain
    mockProfileSingle.mockResolvedValue({
      data: { role: 'user', coach_id: null, full_name: 'Jane Doe' },
    })
    mockProfileEq.mockReturnValue({ single: mockProfileSingle })
    mockProfileSelect.mockReturnValue({ eq: mockProfileEq })

    // Default enrollment chain (no enrollment)
    mockEnrollmentSingle.mockResolvedValue({ data: null })
    mockEnrollmentEqActive.mockReturnValue({ single: mockEnrollmentSingle })
    mockEnrollmentEqUser.mockReturnValue({ eq: mockEnrollmentEqActive })
    mockEnrollmentSelect.mockReturnValue({ eq: mockEnrollmentEqUser })

    // Default program chain
    mockProgramSingle.mockResolvedValue({ data: { id: 'prog-1' } })
    mockProgramLimit.mockReturnValue({ single: mockProgramSingle })
    mockProgramEq.mockReturnValue({ limit: mockProgramLimit })
    mockProgramSelect.mockReturnValue({ eq: mockProgramEq })

    // Default enrollment insert
    mockEnrollInsert.mockResolvedValue({ error: null })
  })

  describe('GettingStartedCard renders correctly', () => {
    it('should render "Getting Started" heading and BuildBase branding', () => {
      render(<GettingStartedCard hasCoach={false} />)

      expect(screen.getByText('Getting Started')).toBeDefined()
      expect(screen.getByText('Build')).toBeDefined()
      expect(screen.getByText('Base')).toBeDefined()
    })

    it('should show coach-optional message when user has no coach', () => {
      render(<GettingStartedCard hasCoach={false} />)

      expect(screen.getByText(/A training program will be assigned to you shortly/)).toBeDefined()
      expect(screen.getByText('Structured Programs')).toBeDefined()
      expect(screen.getByText(/Follow a structured 12-week strength training plan/)).toBeDefined()
    })

    it('should show coach-specific message when user has a coach', () => {
      render(<GettingStartedCard hasCoach={true} />)

      expect(screen.getByText(/Your coach will assign you a training program soon/)).toBeDefined()
      expect(screen.getByText('Coach Guidance')).toBeDefined()
      expect(screen.getByText(/Get personalized notes and form feedback from your coach/)).toBeDefined()
    })

    it('should show feature preview items (Log Workouts, Track Progress)', () => {
      render(<GettingStartedCard hasCoach={false} />)

      expect(screen.getByText('Log Workouts')).toBeDefined()
      expect(screen.getByText('Track Progress')).toBeDefined()
      expect(screen.getByText(/Track sets, reps, and weights/)).toBeDefined()
      expect(screen.getByText(/See your strength gains over time/)).toBeDefined()
    })

    it('should NOT contain normal dashboard content like Next Session or Start Workout', () => {
      const { container } = render(<GettingStartedCard hasCoach={false} />)

      expect(container.textContent).not.toContain('Next Session')
      expect(container.textContent).not.toContain('Start Workout')
    })
  })

  describe('GettingStartedCard vs normal dashboard content', () => {
    it('should show different third feature row based on coach status', () => {
      const { container: noCoach } = render(<GettingStartedCard hasCoach={false} />)
      expect(noCoach.textContent).toContain('Structured Programs')
      expect(noCoach.textContent).not.toContain('Coach Guidance')

      const { container: withCoach } = render(<GettingStartedCard hasCoach={true} />)
      expect(withCoach.textContent).toContain('Coach Guidance')
      expect(withCoach.textContent).not.toContain('Structured Programs')
    })
  })

  describe('Onboarding completion redirects to dashboard', () => {
    it('should redirect to /dashboard after successful onboarding', async () => {
      const { redirect } = await import('next/navigation')
      const { completeOnboarding } = await import('@/app/onboarding/actions')

      await completeOnboarding({
        full_name: 'Jane Doe',
        gender: 'female',
        template_tier: 'default',
      })

      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })

    it('should create enrollment during onboarding so dashboard shows normal content', async () => {
      const { completeOnboarding } = await import('@/app/onboarding/actions')

      await completeOnboarding({
        full_name: 'Jane Doe',
        gender: 'female',
        template_tier: 'default',
      })

      // Verify enrollment was created
      expect(mockFrom).toHaveBeenCalledWith('user_enrollments')
      expect(mockEnrollInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        program_id: 'prog-1',
        template_tier: 'default',
        gender_applied: 'female',
      })
    })
  })
})

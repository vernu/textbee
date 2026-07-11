import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { server } from '@/test/msw/server'
import { API_BASE_URL, mockUser } from '@/test/fixtures'
import GetStartedCard from './index'

// Fail-closed policy: the checklist may only render from complete data. A
// backend failure must never show a fresh user "stuck on Verify your email".

describe('GetStartedCard states', () => {
  it('renders the error card with retry when whoAmI fails (no checklist)', async () => {
    server.use(
      http.get(`${API_BASE_URL}/auth/who-am-i`, () =>
        HttpResponse.json({ message: 'down' }, { status: 500 })
      )
    )

    renderWithProviders(<GetStartedCard />)

    await waitFor(() =>
      expect(
        screen.getByText(/Couldn't load your setup status/)
      ).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    // Never render steps computed from missing data.
    expect(screen.queryByText('Verify your email')).not.toBeInTheDocument()
  })

  it('renders progress and the active step for a mid-funnel user', async () => {
    server.use(
      http.get(`${API_BASE_URL}/auth/who-am-i`, () =>
        HttpResponse.json({
          data: { ...mockUser, emailVerifiedAt: null, onboardingCompletedAt: null },
        })
      )
    )

    renderWithProviders(<GetStartedCard />)

    // 5 of 6 done (only verify_email pending with the default fixtures).
    await waitFor(() =>
      expect(screen.getByText('5 of 6')).toBeInTheDocument()
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    // The active step is expanded with its inline resend action.
    expect(screen.getByText('Verify your email')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /resend email/i })
    ).toBeInTheDocument()
    // The user's email address is surfaced.
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
  })

  it('shows full progress for an all-done user (before auto-complete lands)', async () => {
    renderWithProviders(<GetStartedCard />)

    await waitFor(() => expect(screen.getByText('6 of 6')).toBeInTheDocument())
    expect(screen.getByText('All steps complete!')).toBeInTheDocument()
  })
})

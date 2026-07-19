import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from './register-form'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))

const signIn = vi.fn()
vi.mock('next-auth/react', () => ({ signIn: (...a: unknown[]) => signIn(...a) }))

vi.mock('@/lib/turnstile', () => ({
  useTurnstile: (opts: { onToken?: (t: string) => void }) => {
    opts.onToken?.('test-turnstile-token')
    return { containerRef: { current: null }, token: 'test-turnstile-token', error: null, isReady: true }
  },
}))

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Full Name'), 'Ada Lovelace')
  await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /create account|sign up|register/i }))
}

// register-form already handles errors correctly (redirect:false). These lock
// that so the login bug (dead error branch under redirect:true) cannot be
// reintroduced here unnoticed.
describe('RegisterForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows an error and does not navigate when registration fails', async () => {
    signIn.mockResolvedValueOnce({ error: 'CredentialsSignin', ok: false })
    render(<RegisterForm />)
    await fillAndSubmit()

    expect(await screen.findByText(/failed to create account/i)).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('submits with redirect:false so the result is readable', async () => {
    signIn.mockResolvedValueOnce({ ok: true, error: null })
    render(<RegisterForm />)
    await fillAndSubmit()

    await waitFor(() => expect(signIn).toHaveBeenCalled())
    expect(signIn).toHaveBeenCalledWith(
      'email-password-register',
      expect.objectContaining({ redirect: false })
    )
  })

  it('navigates to verify-email on success', async () => {
    signIn.mockResolvedValueOnce({ ok: true, error: null })
    render(<RegisterForm />)
    await fillAndSubmit()

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/verify-email?verificationEmailSent=1')
    )
  })
})

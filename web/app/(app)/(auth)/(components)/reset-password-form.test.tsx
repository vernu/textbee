import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordForm from './reset-password-form'

const post = vi.fn()
vi.mock('@/lib/httpBrowserClient', () => ({ default: { post: (...a: unknown[]) => post(...a) } }))

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('New Password'), 'newpassword123')
  await userEvent.type(screen.getByLabelText('Confirm Password'), 'newpassword123')
  await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
}

describe('ResetPasswordForm', () => {
  beforeEach(() => vi.clearAllMocks())

  const renderForm = () =>
    render(<ResetPasswordForm email='user@example.com' otp='1234' />)

  // The bug: the catch set root.serverError but the JSX read errors.root.message,
  // so a failed reset showed an empty paragraph and no message.
  it('shows an error message when the reset fails', async () => {
    post.mockRejectedValueOnce(new Error('boom'))
    renderForm()
    await fillAndSubmit()

    expect(
      await screen.findByText(/failed to reset password/i)
    ).toBeInTheDocument()
  })

  // The second bug: the handler swallows the error, so isSubmitSuccessful stays
  // true and the success alert rendered even on failure.
  it('does not claim success when the reset fails', async () => {
    post.mockRejectedValueOnce(new Error('boom'))
    renderForm()
    await fillAndSubmit()

    await screen.findByText(/failed to reset password/i)
    expect(
      screen.queryByText(/password reset successful/i)
    ).not.toBeInTheDocument()
  })

  it('shows the success alert when the reset succeeds', async () => {
    post.mockResolvedValueOnce({ data: {} })
    renderForm()
    await fillAndSubmit()

    expect(
      await screen.findByText(/password reset successful/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/failed to reset password/i)
    ).not.toBeInTheDocument()
  })
})

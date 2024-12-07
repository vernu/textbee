'use client'

import { useSearchParams } from 'next/navigation'
import ResetPasswordForm from '../(components)/reset-password-form'

import RequestPasswordResetForm from '../(components)/request-password-reset-form'
import { useQuery } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const email = searchParams.get('email')

  const session = useSession()
  const {
    mutate: verifyEmail,
    isPending: isVerifyingEmail,
    isSuccess: isVerifyingEmailSuccess,
    isError: isVerifyingEmailError,
    error: verifyingEmailError,
  } = useMutation({
    mutationFn: () =>
      httpBrowserClient.post(ApiEndpoints.auth.verifyEmail(), {
        email: decodeURIComponent(email),
        code,
      }),
  })

  if (!email) {
    return <div>Email is required</div>
  }

  if (code && email) {
    verifyEmail()
  }

  return <RequestPasswordResetForm />
}

'use client'

import { useSearchParams } from 'next/navigation'
import ResetPasswordForm from '../(components)/reset-password-form'

import RequestPasswordResetForm from '../(components)/request-password-reset-form'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const otp = searchParams.get('otp')
  const email = searchParams.get('email')

  if (otp && email) {
    return <ResetPasswordForm email={decodeURIComponent(email)} otp={otp} />
  }

  return <RequestPasswordResetForm />
}

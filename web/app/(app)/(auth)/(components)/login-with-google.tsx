'use client'

import { Routes } from '@/config/routes'
import { toast } from '@/hooks/use-toast'
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from '@react-oauth/google'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

// The provider lives here rather than in the app-wide tree so the Google
// Identity SDK is only loaded on the two pages that render this button
// (login and register) instead of on every dashboard page.
export default function LoginWithGoogle() {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}
    >
      <GoogleLoginButton />
    </GoogleOAuthProvider>
  )
}

function GoogleLoginButton() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const onGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    toast({
      title: 'Success',
      description: 'You are logged in with Google',
      variant: 'default',
    })
    await signIn('google-id-token-login', {
      redirect: true,
      callbackUrl: redirect ? decodeURIComponent(redirect) : Routes.dashboard,
      idToken: credentialResponse.credential,
    })
  }

  const onGoogleLoginError = () => {
    toast({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive',
    })
  }
  return (
    <GoogleLogin
      onSuccess={onGoogleLoginSuccess}
      onError={onGoogleLoginError}
      useOneTap={true}
      width={'100%'}
      size='large'
      shape='pill'
      locale='en'
      theme='outline'
      text='continue_with'
    />
  )
}

'use client'

import { Routes } from '@/config/routes'
import { toast } from '@/hooks/use-toast'
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from '@react-oauth/google'
import { getSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { readAttribution } from '@/lib/analytics/attribution'
import { track } from '@/lib/analytics/track'

// The provider lives here rather than in the app-wide tree so the Google
// Identity SDK is only loaded on the two pages that render this button
// (login and register) instead of on every dashboard page.
export default function LoginWithGoogle() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  // Without a client id there is no Google sign-in to offer, and rendering the
  // provider anyway would load Google's SDK on a self-hosted instance that
  // never configured it.
  if (!clientId) return null

  return (
    <GoogleOAuthProvider clientId={clientId}>
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
    // This button also serves /login, so attribution is sent every time and the
    // API applies it only when it creates the account.
    const attribution = readAttribution()
    const destination = redirect ? decodeURIComponent(redirect) : Routes.dashboard

    // redirect:false on purpose: with redirect:true the browser navigates away
    // and this promise never resolves, so a first sign-in could never be told
    // apart from a returning one.
    const result = await signIn('google-id-token-login', {
      redirect: false,
      idToken: credentialResponse.credential,
      ...(attribution && { attribution: JSON.stringify(attribution) }),
    })

    if (result?.error) {
      toast({
        title: 'Error',
        description: 'Could not sign you in with Google',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: 'You are logged in with Google',
      variant: 'default',
    })

    const session = await getSession()
    if (session?.user?.isNewUser) track('sign_up', { method: 'google' })

    router.push(destination)
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

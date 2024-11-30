'use client'

import { Routes } from '@/config/routes'
import { toast } from '@/hooks/use-toast'
import { CredentialResponse, GoogleLogin } from '@react-oauth/google'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginWithGoogle() {
  const router = useRouter()

  const onGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    toast({
      title: 'Success',
      description: 'You are logged in with Google',
      variant: 'default',
    })
    await signIn('google-id-token-login', {
      redirect: false,
      idToken: credentialResponse.credential,
    })
    router.push(Routes.dashboard)
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

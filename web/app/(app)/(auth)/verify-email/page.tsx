'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { Routes } from '@/config/routes'

const ErrorAlert = ({ message }: { message: string }) => (
  <Alert
    variant='destructive'
    className='bg-red-50 text-red-700 border-red-200'
  >
    <XCircle className='h-5 w-5 text-red-600' />
    <AlertTitle className='text-lg font-semibold'>Error</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
)

const SendVerificationButton = ({
  onClick,
  isLoading,
  hasVerificationCode,
}: {
  onClick: () => void
  isLoading: boolean
  hasVerificationCode: boolean
}) => (
  <Button
    className='w-full text-lg py-6'
    onClick={onClick}
    disabled={isLoading}
  >
    {isLoading ? (
      <Loader2 className='mr-2 h-5 w-5 animate-spin' />
    ) : (
      <Mail className='mr-2 h-5 w-5' />
    )}
    {hasVerificationCode
      ? 'Resend Verification Email'
      : 'Send Verification Email'}
  </Button>
)

const SendVerificationEmail = () => {
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const {
    mutate: sendVerificationEmailMutation,
    isPending: isSendingVerificationEmail,
  } = useMutation({
    mutationFn: () =>
      httpBrowserClient.post(
        ApiEndpoints.auth.sendEmailVerificationEmail(),
        {}
      ),
    onSuccess: () => {
      setSuccessMessage('Verification email has been sent to your inbox')
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to send verification email')
    },
  })

  const renderContent = () => {
    if (successMessage)
      return (
        <Alert
          variant='default'
          className='bg-blue-50 text-blue-700 border-blue-200'
        >
          <Mail className='h-5 w-5 text-blue-600' />
          <AlertTitle className='text-lg font-semibold'>Email Sent</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )
    if (error) return <ErrorAlert message={error} />
    return null
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Email Verification</CardTitle>
        <CardDescription>
          Send a verification email to verify your account
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>{renderContent()}</CardContent>
      <CardFooter>
        <SendVerificationButton
          onClick={() => sendVerificationEmailMutation()}
          isLoading={isSendingVerificationEmail}
          hasVerificationCode={false}
        />
      </CardFooter>
    </Card>
  )
}

const VerifyEmail = ({
  userId,
  verificationCode,
}: {
  userId: string
  verificationCode: string
}) => {
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isVerified, setIsVerified] = useState(false)

  const { mutate: verifyEmailMutation, isPending: isVerifyingEmail } =
    useMutation({
      mutationFn: () =>
        httpBrowserClient.post('/auth/verify-email', {
          userId,
          verificationCode,
        }),
      onSuccess: () => {
        setIsVerified(true)
        setSuccessMessage('Your email has been successfully verified')
      },
      onError: (error: any) => {
        setError(error.message || 'Failed to verify email')
      },
    })

  useEffect(() => {
    verifyEmailMutation()
  }, [verifyEmailMutation])

  const renderContent = () => {
    if (isVerifyingEmail)
      return (
        <div className='flex justify-center py-8'>
          <Loader2 className='h-12 w-12 animate-spin text-primary' />
        </div>
      )
    if (isVerified)
      return (
        <Alert
          variant='default'
          className='bg-green-50 text-green-700 border-green-200'
        >
          <CheckCircle className='h-5 w-5 text-green-600' />
          <AlertTitle className='text-lg font-semibold'>Success</AlertTitle>
          <AlertDescription>
            <div className='flex flex-col gap-2'>
              <div>{successMessage}</div>
              <Link href={Routes.dashboard} className='font-medium underline'>
                Go to Dashboard
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )
    if (error) return <ErrorAlert message={error} />
    return null
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Email Verification</CardTitle>
        <CardDescription>Verifying your email address...</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>{renderContent()}</CardContent>
      <CardFooter className='flex flex-col gap-4'>
        {isVerified && (
          <Button className='w-full text-lg py-6' asChild>
            <Link href='/dashboard'>
              Go to Dashboard
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

const CheckEmailPrompt = () => {
  const {
    mutate: sendVerificationEmailMutation,
    isPending,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: () =>
      httpBrowserClient.post(
        ApiEndpoints.auth.sendEmailVerificationEmail(),
        {}
      ),
  })

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Check your email</CardTitle>
        <CardDescription>
          We've sent you a verification email. Please check your inbox and click
          the link to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isSuccess && (
          <Alert className='bg-green-50 text-green-700 border-green-200'>
            <CheckCircle className='h-5 w-5 text-green-600' />
            <AlertTitle className='text-lg font-semibold'>
              Email Sent
            </AlertTitle>
            <AlertDescription>
              A new verification email has been sent to your inbox
            </AlertDescription>
          </Alert>
        )}
        {isError && (
          <Alert
            variant='destructive'
            className='bg-red-50 text-red-700 border-red-200'
          >
            <XCircle className='h-5 w-5 text-red-600' />
            <AlertTitle className='text-lg font-semibold'>Error</AlertTitle>
            <AlertDescription>
              Failed to resend verification email
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className='flex flex-col gap-4'>
        <div className='flex items-center gap-2 justify-center w-full'>
          <span className='text-sm text-gray-600'>
            Didn't receive the email?
          </span>
          <Button
            variant='link'
            onClick={() => sendVerificationEmailMutation()}
            disabled={isPending}
            className='text-sm p-0 h-auto font-semibold'
          >
            {isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              'Click to resend'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const verificationCode = searchParams.get('verificationCode')
  const verificationEmailSent = searchParams.get('verificationEmailSent')

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4'>
      {userId && verificationCode ? (
        <VerifyEmail userId={userId} verificationCode={verificationCode} />
      ) : verificationEmailSent ? (
        <CheckEmailPrompt />
      ) : (
        <SendVerificationEmail />
      )}
    </div>
  )
}

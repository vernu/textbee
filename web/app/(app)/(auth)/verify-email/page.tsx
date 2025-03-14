'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { useMutation, useQuery } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { Routes } from '@/config/routes'

// Reusable components
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

const SuccessAlert = ({ title, message }: { title: string; message: string }) => (
  <Alert className='bg-green-50 text-green-700 border-green-200'>
    <CheckCircle className='h-5 w-5 text-green-600' />
    <AlertTitle className='text-lg font-semibold'>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
)

const InfoAlert = ({ title, message }: { title: string; message: string }) => (
  <Alert className='bg-blue-50 text-blue-700 border-blue-200'>
    <Mail className='h-5 w-5 text-blue-600' />
    <AlertTitle className='text-lg font-semibold'>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
)

const LoadingSpinner = () => (
  <div className='flex justify-center py-6'>
    <Loader2 className='h-10 w-10 animate-spin text-primary' />
  </div>
)

const DashboardButton = () => (
  <Button className='w-full py-5 mt-2' asChild>
    <Link href={Routes.dashboard}>
      Go to Dashboard
      <ArrowRight className='ml-2 h-5 w-5' />
    </Link>
  </Button>
)

const LoginButton = () => (
  <Button className='w-full py-5 mt-2' asChild>
    <Link href='/login'>
      Go to Login
      <ArrowRight className='ml-2 h-5 w-5' />
    </Link>
  </Button>
)

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const verificationCode = searchParams.get('verificationCode')
  const verificationEmailSent = searchParams.get('verificationEmailSent')
  
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Check user authentication and email verification status
  const { 
    data: whoAmIData, 
    isPending: isCheckingAuth,
    isError: isAuthError 
  } = useQuery({
    queryKey: ['whoAmI'],
    queryFn: () => httpBrowserClient.get(ApiEndpoints.auth.whoAmI()),
    retry: 1,
  })

  const user = whoAmIData?.data?.data
  const isEmailVerified = !!user?.emailVerifiedAt
  const isLoggedIn = !isAuthError && !!user

  // Verify email mutation
  const { 
    mutate: verifyEmail, 
    isPending: isVerifying 
  } = useMutation({
    mutationFn: () => httpBrowserClient.post('/auth/verify-email', {
      userId,
      verificationCode,
    }),
    onSuccess: () => {
      setSuccessMessage('Your email has been successfully verified')
      setErrorMessage('')
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Failed to verify email')
    },
  })

  // Send verification email mutation
  const { 
    mutate: sendVerificationEmail, 
    isPending: isSending 
  } = useMutation({
    mutationFn: () => httpBrowserClient.post(
      ApiEndpoints.auth.sendEmailVerificationEmail(),
      {}
    ),
    onSuccess: () => {
      if (!verificationEmailSent) {
        router.push('/verify-email?verificationEmailSent=true')
      } else {
        setSuccessMessage('Verification email has been sent to your inbox')
        setErrorMessage('')
      }
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Failed to send verification email')
    },
  })

  // Handle verification when code is provided
  useEffect(() => {
    if (userId && verificationCode && !isVerifying && !successMessage && !errorMessage) {
      if (isEmailVerified) {
        setSuccessMessage('Your email has already been verified')
      } else if (!isCheckingAuth) {
        verifyEmail()
      }
    }
  }, [userId, verificationCode, isCheckingAuth, isEmailVerified, isVerifying, successMessage, errorMessage, verifyEmail])

  // Render content based on current state
  const renderContent = () => {
    // Show loading state
    if (isCheckingAuth) {
      return (
        <>
          <CardHeader>
            <CardTitle className='text-2xl font-bold'>Email Verification</CardTitle>
            <CardDescription>Checking verification status...</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner />
          </CardContent>
        </>
      )
    }

    // Handle verification process
    if (userId && verificationCode) {
      return (
        <>
          <CardHeader>
            <CardTitle className='text-2xl font-bold'>Email Verification</CardTitle>
            <CardDescription>
              {isVerifying ? 'Verifying your email address...' : 'Email Verification Status'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {isVerifying ? (
              <LoadingSpinner />
            ) : successMessage ? (
              <SuccessAlert title="Success" message={successMessage} />
            ) : errorMessage ? (
              <ErrorAlert message={errorMessage} />
            ) : null}
          </CardContent>
          <CardFooter>
            {successMessage && <DashboardButton />}
          </CardFooter>
        </>
      )
    }

    // Handle "check your email" state
    if (verificationEmailSent) {
      return (
        <>
          <CardHeader>
            <CardTitle className='text-2xl font-bold'>Check Your Email</CardTitle>
            <CardDescription>
              We've sent you a verification email. Please check your inbox and click
              the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {successMessage && (
              <InfoAlert title="Email Sent" message={successMessage} />
            )}
            {errorMessage && (
              <ErrorAlert message={errorMessage} />
            )}
            {isEmailVerified && (
              <SuccessAlert 
                title="Already Verified" 
                message="Your email has already been verified" 
              />
            )}
          </CardContent>
          <CardFooter className='flex flex-col gap-3'>
            {isEmailVerified ? (
              <DashboardButton />
            ) : (
              <div className='flex items-center gap-2 justify-center w-full'>
                <span className='text-sm text-gray-600'>
                  Didn't receive the email?
                </span>
                <Button
                  variant='link'
                  onClick={() => sendVerificationEmail()}
                  disabled={isSending}
                  className='text-sm p-0 h-auto font-semibold'
                >
                  {isSending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    'Click to resend'
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </>
      )
    }

    // Handle "send verification email" state
    return (
      <>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>Email Verification</CardTitle>
          <CardDescription>
            {isLoggedIn 
              ? isEmailVerified
                ? 'Your email is already verified'
                : 'Verify your email address to access all features'
              : 'You need to be logged in to verify your email'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {successMessage && (
            <InfoAlert title="Email Sent" message={successMessage} />
          )}
          {errorMessage && (
            <ErrorAlert message={errorMessage} />
          )}
          {isEmailVerified && (
            <SuccessAlert 
              title="Already Verified" 
              message="Your email has already been verified" 
            />
          )}
          {!isLoggedIn && (
            <Alert
              variant='destructive'
              className='bg-red-50 text-red-700 border-red-200'
            >
              <XCircle className='h-5 w-5 text-red-600' />
              <AlertTitle className='text-lg font-semibold'>Not Logged In</AlertTitle>
              <AlertDescription>
                You need to be logged in to verify your email
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {isLoggedIn ? (
            isEmailVerified ? (
              <DashboardButton />
            ) : (
              <Button
                className='w-full py-5'
                onClick={() => sendVerificationEmail()}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                ) : (
                  <Mail className='mr-2 h-5 w-5' />
                )}
                Send Verification Email
              </Button>
            )
          ) : (
            <LoginButton />
          )}
        </CardFooter>
      </>
    )
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4'>
      <Card className='w-full max-w-md shadow-lg border-gray-200 dark:border-gray-800'>
        {renderContent()}
      </Card>
    </div>
  )
}

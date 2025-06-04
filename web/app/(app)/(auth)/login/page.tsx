'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import LoginWithGoogle from '../(components)/login-with-google'
import LoginForm from '../(components)/login-form'
import { Routes } from '@/config/routes'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100 dark:bg-muted'>
      <Card className='w-[400px] shadow-lg'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Welcome back
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className='relative mt-4'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background dark:bg-muted px-2 text-muted-foreground'>
                Or
              </span>
            </div>
          </div>
          <div className='mt-4 flex justify-center'>
            <LoginWithGoogle />
          </div>
        </CardContent>
        <CardFooter className='flex flex-col space-y-2 text-center'>
          <Link
            href={Routes.resetPassword}
            className='text-sm text-brand-600 hover:underline'
          >
            Forgot your password?
          </Link>
          <p className='text-sm text-gray-600'>
            Don&apos;t have an account?{' '}
            <Link
              href={{
                pathname: Routes.register,
                query: {
                  redirect: redirect ? decodeURIComponent(redirect) : undefined,
                },
              }}
              className='font-medium text-brand-600 hover:underline'
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

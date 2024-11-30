'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import LoginWithGoogle from '../(components)/login-with-google'
import RegisterForm from '../(components)/register-form'
import { Routes } from '@/config/routes'

export default function RegisterPage() {
  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100'>
      <Card className='w-[450px] shadow-lg'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Create an account
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <div className='mt-4 flex justify-center'>
            <LoginWithGoogle />
          </div>
        </CardContent>
        <CardFooter className='text-center'>
          <p className='text-sm text-gray-600'>
            Already have an account?{' '}
            <Link
              href={Routes.login}
              className='font-medium text-blue-600 hover:underline'
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

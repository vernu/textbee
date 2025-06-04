'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
// import { Icons } from "@/components/ui/icons"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { Routes } from '@/config/routes'

const requestPasswordResetSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
})

type RequestPasswordResetFormValues = z.infer<typeof requestPasswordResetSchema>

export default function RequestPasswordResetForm() {
  const form = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  const onRequestPasswordReset = async (
    data: RequestPasswordResetFormValues
  ) => {
    form.clearErrors()
    try {
      await httpBrowserClient.post(
        ApiEndpoints.auth.requestPasswordReset(),
        data
      )
    } catch (error) {
      form.setError('email', { message: 'Invalid email address' })
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100 dark:bg-muted'>
      <Card className='w-[400px] shadow-lg'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Reset your password
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!form.formState.isSubmitted ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onRequestPasswordReset)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='m@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  className='w-full'
                  type='submit'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      {/* <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> */}
                      Sending reset link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Alert>
              {/* <Icons.checkCircle className="h-4 w-4" /> */}
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>
                If an account exists for {form.getValues().email}, you will
                receive a password reset link shortly.
              </AlertDescription>
              <AlertDescription className='mt-4 text-sm text-muted-foreground italic'>
                If you don&apos;t receive an email, please check your spam
                folder or contact support.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className='text-center'>
          <Link
            href={Routes.login}
            className='text-sm text-brand-600 hover:underline'
          >
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Routes } from '@/config/routes'

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    confirmPassword: z
      .string()
      .min(4, { message: 'Please confirm your password' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords must match',
        path: ['confirmPassword'],
      })
    }
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordForm() {
  const { toast } = useToast()

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const {
    mutate: changePassword,
    isPending: isChangingPassword,
    error: changePasswordError,
    isSuccess: isChangePasswordSuccess,
  } = useMutation({
    mutationFn: (data: ChangePasswordFormData) =>
      httpBrowserClient.post(ApiEndpoints.auth.changePassword(), data),
    onSuccess: () => {
      toast({
        title: 'Password changed successfully!',
      })
      changePasswordForm.reset()
    },
    onError: (error) => {
      const errorMessage = (error as any).response?.data?.error
      changePasswordForm.setError('root.serverError', {
        message: errorMessage || 'Failed to change password',
      })
      toast({
        title: 'Failed to change password',
      })
    },
  })

  return (
    <>
      <p className='text-sm text-muted-foreground mb-4'>
        If you signed in with Google, you can reset your password{' '}
        <Link href={Routes.resetPassword} className='underline'>
          here
        </Link>
        .
      </p>
      
      <form
        onSubmit={changePasswordForm.handleSubmit((data) => changePassword(data))}
        className='space-y-4'
      >
        <div className='space-y-2'>
          <Label htmlFor='oldPassword'>Old Password</Label>
          <Input
            id='oldPassword'
            type='password'
            {...changePasswordForm.register('oldPassword')}
            placeholder='Enter your old password'
          />
          {changePasswordForm.formState.errors.oldPassword && (
            <p className='text-sm text-destructive'>
              {changePasswordForm.formState.errors.oldPassword.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='newPassword'>New Password</Label>
          <Input
            id='newPassword'
            type='password'
            {...changePasswordForm.register('newPassword')}
            placeholder='Enter your new password'
          />
          {changePasswordForm.formState.errors.newPassword && (
            <p className='text-sm text-destructive'>
              {changePasswordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <Input
            id='confirmPassword'
            type='password'
            {...changePasswordForm.register('confirmPassword')}
            placeholder='Enter your confirm password'
          />
          {changePasswordForm.formState.errors.confirmPassword && (
            <p className='text-sm text-destructive'>
              {changePasswordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {changePasswordForm.formState.errors.root?.serverError && (
          <p className='text-sm text-destructive'>
            {changePasswordForm.formState.errors.root.serverError.message}
          </p>
        )}

        {isChangePasswordSuccess && (
          <p className='text-sm text-green-500'>
            Password changed successfully!
          </p>
        )}

        <Button
          type='submit'
          className='w-full mt-6'
          disabled={isChangingPassword}
        >
          {isChangingPassword ? (
            <Loader2 className='h-4 w-4 animate-spin mr-2' />
          ) : null}
          Change Password
        </Button>
      </form>
    </>
  )
} 
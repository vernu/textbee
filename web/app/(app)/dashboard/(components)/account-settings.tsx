'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Mail,
  Shield,
  UserCircle,
  Loader2,
  Check,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { Routes } from '@/config/routes'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^\+?\d{0,14}$/, 'Invalid phone number')
    .optional(),
})

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

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

export default function AccountSettings() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const { update: updateSession } = useSession()

  const { toast } = useToast()

  const {
    data: currentUser,
    isLoading: isLoadingUser,
    refetch: refetchCurrentUser,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.whoAmI())
        .then((res) => res.data?.data),
  })

  const updateProfileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: currentUser?.name,
      email: currentUser?.email,
      phone: currentUser?.phone,
    },
  })

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const handleDeleteAccount = () => {
    if (deleteConfirmEmail !== currentUser?.email) {
      toast({
        title: 'Please enter your correct email address',
      })
      return
    }
    requestAccountDeletion()
  }

  const handleVerifyEmail = () => {
    // TODO: Implement email verification
  }

  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile,
    error: updateProfileError,
    isSuccess: isUpdateProfileSuccess,
  } = useMutation({
    mutationFn: (data: UpdateProfileFormData) =>
      httpBrowserClient.patch(ApiEndpoints.auth.updateProfile(), data),
    onSuccess: () => {
      refetchCurrentUser()
      toast({
        title: 'Profile updated successfully!',
      })
      updateSession({
        name: updateProfileForm.getValues().name,
        phone: updateProfileForm.getValues().phone,
      })
    },
    onError: () => {
      toast({
        title: 'Failed to update profile',
      })
    },
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

  const [deleteReason, setDeleteReason] = useState('')

  const {
    mutate: requestAccountDeletion,
    isPending: isRequestingAccountDeletion,
    error: requestAccountDeletionError,
    isSuccess: isRequestAccountDeletionSuccess,
  } = useMutation({
    mutationFn: () =>
      axios.post('/api/request-account-deletion', {
        message: deleteReason,
      }),
    onSuccess: () => {
      toast({
        title: 'Account deletion request submitted',
      })
    },
    onError: () => {
      toast({
        title: 'Failed to submit account deletion request',
      })
    },
  })

  if (isLoadingUser)
    return (
      <div className='flex justify-center items-center h-full'>
        <Spinner size='sm' />
      </div>
    )

  return (
    <div className='grid gap-6 max-w-2xl mx-auto'>
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <UserCircle className='h-5 w-5' />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={updateProfileForm.handleSubmit((data) =>
              updateProfile(data)
            )}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                {...updateProfileForm.register('name')}
                placeholder='Enter your full name'
                defaultValue={currentUser?.name}
              />
              {updateProfileForm.formState.errors.name && (
                <p className='text-sm text-destructive'>
                  {updateProfileForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='flex items-center gap-2'>
                Email Address
                {currentUser?.emailVerifiedAt && (
                  <Badge variant='secondary' className='ml-2'>
                    <Shield className='h-3 w-3 mr-1' />
                    Verified
                  </Badge>
                )}
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='email'
                  type='email'
                  {...updateProfileForm.register('email')}
                  placeholder='Enter your email'
                  defaultValue={currentUser?.email}
                  disabled
                />
                {!currentUser?.emailVerifiedAt ? (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleVerifyEmail}
                    disabled={true}
                  >
                    {isUpdatingProfile ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Mail className='h-4 w-4 mr-2' />
                    )}
                    Verify
                  </Button>
                ) : (
                  <Button variant='outline' disabled>
                    <Check className='h-4 w-4 mr-2' />
                    Verified
                  </Button>
                )}
              </div>
              {updateProfileForm.formState.errors.email && (
                <p className='text-sm text-destructive'>
                  {updateProfileForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                type='tel'
                {...updateProfileForm.register('phone')}
                placeholder='Enter your phone number'
                defaultValue={currentUser?.phone}
              />
              {updateProfileForm.formState.errors.phone && (
                <p className='text-sm text-destructive'>
                  {updateProfileForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            {isUpdateProfileSuccess && (
              <p className='text-sm text-green-500'>
                Profile updated successfully!
              </p>
            )}

            <Button
              type='submit'
              className='w-full mt-6'
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>
            If you signed in with google, your can reset your password{' '}
            <Link href={Routes.resetPassword} className='underline'>
              here
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={changePasswordForm.handleSubmit((data) =>
              changePassword(data)
            )}
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
              <Label htmlFor='oldPassword'>Old Password</Label>
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
        </CardContent>
      </Card>

      <Card className='border-destructive/50'>
        <CardHeader>
          <div className='flex items-center gap-2 text-destructive'>
            <AlertTriangle className='h-5 w-5' />
            <CardTitle>Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <Button
              variant='destructive'
              className='w-full'
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <AlertTriangle className='mr-2 h-4 w-4' />
              Delete Account
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <AlertTriangle className='h-5 w-5 text-destructive' />
                  Delete Account
                </DialogTitle>
                <DialogDescription className='pt-4'>
                  <p className='mb-4'>
                    Are you sure you want to delete your account? This action:
                  </p>
                  <ul className='list-disc list-inside space-y-2 mb-4'>
                    <li>Cannot be undone</li>
                    <li>Will permanently delete all your data</li>
                    <li>Will cancel all active subscriptions</li>
                    <li>Will remove access to all services</li>
                  </ul>

                  {/* enter reason for deletion text area */}
                  <Label htmlFor='deleteReason'>Reason for deletion</Label>
                  <Textarea
                    className='my-2'
                    placeholder='Enter your reason for deletion'
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  />

                  <p>Please type your email address to confirm:</p>

                  <Input
                    className='mt-2'
                    placeholder='Enter your email address'
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  />

                  {requestAccountDeletionError && (
                    <p className='text-sm text-destructive'>
                      {requestAccountDeletionError.message ||
                        'Failed to submit account deletion request'}
                    </p>
                  )}

                  {isRequestAccountDeletionSuccess && (
                    <p className='text-sm text-green-500'>
                      Account deletion request submitted
                    </p>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className='gap-2 sm:gap-0'>
                <Button
                  variant='outline'
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant='destructive'
                  onClick={handleDeleteAccount}
                  disabled={isRequestingAccountDeletion || !deleteConfirmEmail}
                >
                  {isRequestingAccountDeletion ? (
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  ) : (
                    <AlertTriangle className='h-4 w-4 mr-2' />
                  )}
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

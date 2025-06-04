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
  Calendar,
  Info,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
      httpBrowserClient.post(ApiEndpoints.support.requestAccountDeletion(), {
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

  const CurrentSubscription = () => {
    const {
      data: currentSubscription,
      isLoading: isLoadingSubscription,
      error: subscriptionError,
    } = useQuery({
      queryKey: ['currentSubscription'],
      queryFn: () =>
        httpBrowserClient
          .get(ApiEndpoints.billing.currentSubscription())
          .then((res) => res.data),
    })

    if (isLoadingSubscription)
      return (
        <div className='flex justify-center items-center h-full min-h-[200px] mt-10'>
          <Spinner size='sm' />
        </div>
      )
    if (subscriptionError)
      return (
        <p className='text-sm text-destructive'>
          Failed to load subscription information
        </p>
      )

    // Format price with currency symbol
    const formatPrice = (
      amount: number | null | undefined,
      currency: string | null | undefined
    ) => {
      if (amount == null || currency == null) return 'Free'

      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase() || 'USD',
        minimumFractionDigits: 2,
      })

      return formatter.format(amount / 100)
    }

    const getBillingInterval = (interval: string | null | undefined) => {
      if (!interval) return ''
      return interval.toLowerCase() === 'month' ? 'monthly' : 'yearly'
    }

    return (
      <div className='bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border rounded-lg shadow p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
              {currentSubscription?.plan?.name || 'Free Plan'}
            </h3>
            <div className='flex items-center gap-2'>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Current subscription
              </p>
              {currentSubscription?.amount > 0 && (
                <Badge variant='outline' className='text-xs font-medium'>
                  {formatPrice(
                    currentSubscription?.amount,
                    currentSubscription?.currency
                  )}
                  {currentSubscription?.recurringInterval && (
                    <span className='ml-1'>
                      /{' '}
                      {getBillingInterval(
                        currentSubscription?.recurringInterval
                      )}
                    </span>
                  )}
                </Badge>
              )}
            </div>
          </div>
          <div
            className={`flex items-center px-2 py-0.5 rounded-full ${
              currentSubscription?.status === 'active'
                ? 'bg-green-50 dark:bg-green-900/30'
                : currentSubscription?.status === 'past_due'
                ? 'bg-amber-50 dark:bg-amber-900/30'
                : 'bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <Check
              className={`h-3 w-3 mr-1 ${
                currentSubscription?.status === 'active'
                  ? 'text-green-600 dark:text-green-400'
                  : currentSubscription?.status === 'past_due'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                currentSubscription?.status === 'active'
                  ? 'text-green-600 dark:text-green-400'
                  : currentSubscription?.status === 'past_due'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {currentSubscription?.status
                ? currentSubscription.status
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                : 'Active'}
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm'>
            <Calendar className='h-4 w-4 text-brand-600 dark:text-brand-400' />
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Start Date
              </p>
              <p className='text-sm font-medium text-gray-900 dark:text-white'>
                {currentSubscription?.subscriptionStartDate
                  ? new Date(
                      currentSubscription?.subscriptionStartDate
                    ).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm'>
            <Calendar className='h-4 w-4 text-brand-600 dark:text-brand-400' />
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Next Payment
              </p>
              <p className='text-sm font-medium text-gray-900 dark:text-white'>
                {currentSubscription?.currentPeriodEnd
                  ? new Date(
                      currentSubscription?.currentPeriodEnd
                    ).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className='col-span-2 bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm'>
            <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium'>
              Usage Limits
            </p>
            <div className='grid grid-cols-3 gap-3'>
              <div className='bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Daily
                </p>
                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                  {currentSubscription?.plan?.dailyLimit === -1
                    ? 'Unlimited'
                    : currentSubscription?.plan?.dailyLimit || '0'}
                  {currentSubscription?.plan?.dailyLimit === -1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='inline-flex items-center'>
                            <Info className='h-4 w-4 text-gray-500 ml-1 cursor-pointer' />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unlimited (within monthly limit)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
              <div className='bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Monthly
                </p>
                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                  {currentSubscription?.plan?.monthlyLimit === -1
                    ? 'Unlimited'
                    : currentSubscription?.plan?.monthlyLimit?.toLocaleString() ||
                      '0'}
                  {currentSubscription?.plan?.monthlyLimit === -1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='inline-flex items-center'>
                            <Info className='h-4 w-4 text-gray-500 ml-1 cursor-pointer' />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unlimited (within fair usage)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
              <div className='bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>Bulk</p>
                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                  {currentSubscription?.plan?.bulkSendLimit === -1
                    ? 'Unlimited'
                    : currentSubscription?.plan?.bulkSendLimit || '0'}
                  {currentSubscription?.plan?.bulkSendLimit === -1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className='inline-flex items-center'>
                            <Info className='h-4 w-4 text-gray-500 ml-1 cursor-pointer' />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unlimited (within monthly limit)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-4 flex justify-end gap-2'>
          {!currentSubscription?.plan?.name ||
          currentSubscription?.plan?.name?.toLowerCase() === 'free' ? (
            <Link
              href='/checkout/pro'
              className='text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-md transition-colors'
            >
              Upgrade to Pro →
            </Link>
          ) : (
            <Link
              href='https://polar.sh/textbee/portal/'
              className='text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors'
            >
              Manage Subscription →
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (isLoadingUser)
    return (
      <div className='flex justify-center items-center h-full min-h-[200px] mt-10'>
        <Spinner size='sm' />
      </div>
    )

  return (
    <div className='grid gap-6 max-w-2xl mt-10'>
      <CurrentSubscription />
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
                      {(requestAccountDeletionError as any).response?.data
                        ?.message ||
                        requestAccountDeletionError.message ||
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

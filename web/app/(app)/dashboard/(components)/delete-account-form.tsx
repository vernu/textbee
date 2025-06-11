'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function DeleteAccountForm() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const { toast } = useToast()

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.whoAmI())
        .then((res) => res.data?.data),
  })

  const handleDeleteAccount = () => {
    if (deleteConfirmEmail !== currentUser?.email) {
      toast({
        title: 'Please enter your correct email address',
      })
      return
    } else if (deleteReason.length < 4) {
      toast({
        title: 'Please enter a reason for deletion',
      })
      return
    }
    requestAccountDeletion()
  }

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
      setIsDeleteDialogOpen(false)
    },
    onError: () => {
      toast({
        title: 'Failed to submit account deletion request',
      })
    },
  })

  return (
    <>
      <p className='text-sm text-muted-foreground mb-6'>
        Once you delete your account, there is no going back. This action
        permanently removes all your data, cancels subscriptions, and revokes
        access to all services.
      </p>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
    </>
  )
}

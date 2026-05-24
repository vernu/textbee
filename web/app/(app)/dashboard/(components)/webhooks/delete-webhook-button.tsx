'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useToast } from '@/hooks/use-toast'

interface DeleteWebhookButtonProps {
  webhookId: string
  webhookLabel?: string
  onDeleted?: () => void
}

export function DeleteWebhookButton({
  webhookId,
  webhookLabel,
  onDeleted,
}: DeleteWebhookButtonProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { mutate: deleteWebhook, isPending } = useMutation({
    mutationFn: () =>
      httpBrowserClient.delete(ApiEndpoints.gateway.deleteWebhook(webhookId)),
    onSuccess: () => {
      toast({
        title: 'Webhook deleted',
        description: webhookLabel
          ? `"${webhookLabel}" has been removed.`
          : 'The webhook has been removed.',
      })
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      setOpen(false)
      onDeleted?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || 'Failed to delete webhook',
        variant: 'destructive',
      })
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant='outline' size='sm' disabled={isPending}>
          <Trash2 className='h-4 w-4 text-destructive' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
          <AlertDialogDescription>
            {webhookLabel
              ? `Are you sure you want to delete "${webhookLabel}"? `
              : 'Are you sure you want to delete this webhook? '}
            New events will no longer be delivered to this endpoint. Past
            delivery history will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              deleteWebhook()
            }}
            disabled={isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

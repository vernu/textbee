'use client'

import { Button } from '@/components/ui/button'
import { PlusCircle, Webhook } from 'lucide-react'
import { useState } from 'react'
import { WebhookData } from '@/lib/types'
import { WebhookCard } from './webhook-card'
import { WebhookDocs } from './webhook-docs'
import { CreateWebhookDialog } from './create-webhook-dialog'
import { EditWebhookDialog } from './edit-webhook-dialog'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function WebhookCardSkeleton() {
  return (
    <div className='rounded-lg border p-6 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-[200px]' />
          <Skeleton className='h-4 w-[150px]' />
        </div>
        <div className='flex space-x-2'>
          <Skeleton className='h-9 w-9' />
          <Skeleton className='h-9 w-16' />
          <Skeleton className='h-9 w-9' />
        </div>
      </div>
      <div className='space-y-4'>
        <div>
          <Skeleton className='h-4 w-[100px] mb-2' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div>
          <Skeleton className='h-4 w-[100px] mb-2' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div>
          <Skeleton className='h-4 w-[100px] mb-2' />
          <div className='flex gap-2'>
            <Skeleton className='h-6 w-20' />
            <Skeleton className='h-6 w-20' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WebhooksSection() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(
    null
  )
  const queryClient = useQueryClient()

  const {
    data: webhooks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.getWebhooks())
        .then((res) => res.data),
  })

  const handleCreateClick = () => {
    setCreateDialogOpen(true)
  }

  const handleEditClick = (webhook: WebhookData) => {
    setSelectedWebhook(webhook)
    setEditDialogOpen(true)
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Webhook className='h-8 w-8' />
            Webhooks
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className='text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'>
                    BETA
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This feature is in beta and may undergo changes. Use with caution in production environments.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h1>
          <p className='text-muted-foreground mt-2'>
            Manage webhook notifications for your SMS events
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          disabled={webhooks?.data?.length > 0 || isLoading}
          variant='default'
        >
          <PlusCircle className='mr-2 h-4 w-4' />
          Create Webhook
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div>
          {isLoading ? (
            <div className='grid gap-4'>
              <WebhookCardSkeleton />
              <WebhookCardSkeleton />
            </div>
          ) : error ? (
            <div className='rounded-lg border border-destructive/50 p-4 text-destructive'>
              Error: {error.message}
            </div>
          ) : webhooks?.data?.length > 0 ? (
            <div className='grid gap-4'>
              {webhooks.data.map((webhook) => (
                <WebhookCard
                  key={webhook._id}
                  webhook={webhook}
                  onEdit={() => handleEditClick(webhook)}
                />
              ))}
            </div>
          ) : (
            <div className='bg-muted/50 rounded-lg p-8 text-center'>
              <h3 className='text-lg font-medium mb-2'>No webhook configured</h3>
              <p className='text-muted-foreground mb-4'>
                Create a webhook to receive real-time notifications for SMS events
              </p>
              <Button onClick={handleCreateClick} variant='default'>
                <PlusCircle className='mr-2 h-4 w-4' />
                Create Webhook
              </Button>
            </div>
          )}
        </div>

        <div className='hidden lg:block sticky top-8 self-start'>
          <WebhookDocs />
        </div>
      </div>

      <div className='block lg:hidden mt-8'>
        <WebhookDocs />
      </div>

      <CreateWebhookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedWebhook && (
        <EditWebhookDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          webhook={selectedWebhook}
        />
      )}
    </div>
  )
}
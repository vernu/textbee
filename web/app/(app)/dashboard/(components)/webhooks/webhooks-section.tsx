'use client'

import { Button } from '@/components/ui/button'
import { Bell, PlusCircle, Webhook } from 'lucide-react'
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
import { useRouter } from 'next/navigation'

function WebhookRowSkeleton() {
  return (
    <div className='flex items-center gap-3 px-3 py-2.5'>
      <Skeleton className='h-4 w-4 rounded-sm' />
      <Skeleton className='h-4 w-32' />
      <Skeleton className='h-5 w-14 rounded-full' />
      <Skeleton className='hidden md:block h-4 w-48' />
      <div className='ml-auto flex items-center gap-1.5'>
        <Skeleton className='h-5 w-9 rounded-full' />
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>
    </div>
  )
}

const MAX_WEBHOOKS_PER_USER = 5

export default function WebhooksSection() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const navigator = useRouter()
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(
    null,
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

  const webhookCount = webhooks?.data?.length ?? 0
  const reachedLimit = webhookCount >= MAX_WEBHOOKS_PER_USER

  return (
    <div className='container mx-auto py-4 sm:py-6 px-4 sm:px-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2'>
            <Webhook className='h-5 w-5 sm:h-6 sm:w-6' />
            Webhooks
            {!isLoading && webhookCount > 0 && (
              <span className='text-sm font-normal text-muted-foreground'>
                ({webhookCount}/{MAX_WEBHOOKS_PER_USER})
              </span>
            )}
          </h1>
          <p className='text-sm text-muted-foreground mt-1.5'>
            Manage webhook notifications for your SMS events. You can configure
            up to {MAX_WEBHOOKS_PER_USER} webhooks.
          </p>
        </div>
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-x-4'>
          <Button
            onClick={handleCreateClick}
            disabled={reachedLimit || isLoading}
            variant='default'
            className='w-full sm:w-auto'
            title={
              reachedLimit
                ? `You have reached the maximum of ${MAX_WEBHOOKS_PER_USER} webhooks. Delete one to add a new one.`
                : undefined
            }
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Create Webhook
          </Button>
          <Button
            onClick={() => navigator.push('/dashboard/webhooks')}
            variant='default'
            className='w-full sm:w-auto'
          >
            <Bell className='mr-2 h-4 w-4' />
            Notification Deliveries
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8'>
        <div className='space-y-4'>
          {isLoading ? (
            <div className='rounded-md border divide-y'>
              <WebhookRowSkeleton />
              <WebhookRowSkeleton />
              <WebhookRowSkeleton />
              <WebhookRowSkeleton />
              <WebhookRowSkeleton />
            </div>
          ) : error ? (
            <div className='rounded-lg border border-destructive/50 p-4 text-destructive'>
              Error: {error.message}
            </div>
          ) : webhooks?.data?.length > 0 ? (
            <div className='rounded-md border divide-y bg-card overflow-hidden'>
              {webhooks.data.map((webhook) => (
                <WebhookCard
                  key={webhook._id}
                  webhook={webhook}
                  onEdit={() => handleEditClick(webhook)}
                  defaultOpen={webhooks.data.length === 1}
                />
              ))}
            </div>
          ) : (
            <div className='bg-muted/50 rounded-lg p-8 text-center'>
              <h3 className='text-lg font-medium mb-2'>
                No webhooks configured
              </h3>
              <p className='text-muted-foreground mb-4'>
                Add a webhook endpoint to receive real-time notifications for
                SMS events. You can add multiple endpoints for different
                services.
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

      <div className='block lg:hidden mt-4 sm:mt-8'>
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

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteWebhookButton } from './delete-webhook-button'
import { Edit2, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { CopyButton } from '@/components/shared/copy-button'
import { WebhookData } from '@/lib/types'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useQueryClient } from '@tanstack/react-query'

interface WebhookCardProps {
  webhook: WebhookData
  onEdit: () => void
  onDelete?: () => void
}

export function WebhookCard({ webhook, onEdit, onDelete }: WebhookCardProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const [showSecret, setShowSecret] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    try {
      await httpBrowserClient.patch(
        ApiEndpoints.gateway.updateWebhook(webhook._id),
        { isActive: checked }
      )
      
      await queryClient.invalidateQueries({
        queryKey: ['webhooks']
      })

      toast({
        title: `Webhook ${checked ? 'enabled' : 'disabled'}`,
        description: `Webhook notifications are now ${
          checked ? 'enabled' : 'disabled'
        }.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${checked ? 'enable' : 'disable'} webhook`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const maskSecret = (secret: string) => {
    // if the secret is less than 18 characters, show all
    if (secret.length <= 18) {
      return secret.slice(0, 18)
    }
    return secret.slice(0, 18) + '*'.repeat(secret.length - 24)
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center space-x-2'>
            <h3 className='text-lg font-semibold'>Webhook Endpoint</h3>
            <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
              {webhook.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground'>
            Notifications for SMS events
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Switch 
            checked={webhook.isActive} 
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
          <Button variant='outline' size='sm' onClick={onEdit}>
            <Edit2 className='h-4 w-4 mr-2' />
            Edit
          </Button>
          <DeleteWebhookButton onDelete={onDelete} />
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>Delivery URL</label>
            <div className='flex items-center mt-1'>
              <code className='flex-1 bg-muted px-3 py-2 rounded-md text-sm'>
                {webhook.deliveryUrl}
              </code>
              <CopyButton value={webhook.deliveryUrl} label='Copy URL' />
            </div>
          </div>
          <div>
            <label className='text-sm font-medium'>Signing Secret</label>
            <div className='flex items-center mt-1'>
              <code className='flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono'>
                {showSecret ? webhook.signingSecret : maskSecret(webhook.signingSecret)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
                className="mx-2"
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <CopyButton value={webhook.signingSecret} label='Copy Secret' />
            </div>
          </div>
          <div>
            <label className='text-sm font-medium'>Events</label>
            <div className='flex flex-wrap gap-2 mt-1'>
              {webhook.events.map((event) => (
                <Badge key={event} variant='secondary'>
                  {event}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

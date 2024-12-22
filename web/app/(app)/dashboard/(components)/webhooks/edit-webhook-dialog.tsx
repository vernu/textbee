'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { WebhookData } from '@/lib/types'
import { WEBHOOK_EVENTS } from '@/lib/constants'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const formSchema = z.object({
  deliveryUrl: z.string().url({ message: 'Please enter a valid URL' }),
  events: z.array(z.string()).min(1, { message: 'Select at least one event' }),
  isActive: z.boolean().default(true),
  signingSecret: z.string().min(1, { message: 'Signing secret is required' }),
})

interface EditWebhookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  webhook: WebhookData
}

export function EditWebhookDialog({
  open,
  onOpenChange,
  webhook,
}: EditWebhookDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      deliveryUrl: webhook.deliveryUrl,
      events: webhook.events,
      isActive: webhook.isActive,
      signingSecret: webhook.signingSecret,
    },
  })

  const { mutate: updateWebhook, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return httpBrowserClient.patch(
        ApiEndpoints.gateway.updateWebhook(webhook._id),
        values
      )
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Webhook updated successfully',
      })
      // Invalidate and refetch webhooks list
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      onOpenChange(false)
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateWebhook(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
          <DialogDescription>
            Update your webhook configuration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='deliveryUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='https://api.example.com/webhooks'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL where webhook notifications will be sent via POST
                    requests
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='signingSecret'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signing Secret</FormLabel>
                  <FormControl>
                    <div className='flex space-x-2'>
                      <Input {...field} type='text' />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => field.onChange(uuidv4())}
                      >
                        Generate
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Used to verify webhook payload authenticity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='events'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Events</FormLabel>
                  <Select
                    value={field.value[0]}
                    onValueChange={(value) => field.onChange([value])}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select events to subscribe to' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={WEBHOOK_EVENTS.MESSAGE_RECEIVED}>
                        SMS Received
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the events you want to receive notifications for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end space-x-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
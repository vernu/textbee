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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface CreateWebhookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWebhookDialog({
  open,
  onOpenChange,
}: CreateWebhookDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryUrl: '',
      events: [WEBHOOK_EVENTS.MESSAGE_RECEIVED],
      isActive: true,
      signingSecret: uuidv4(),
    },
  })

  const createWebhookMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) =>
      httpBrowserClient.post(ApiEndpoints.gateway.createWebhook(), values),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Webhook created successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createWebhookMutation.mutate(values)
  }

  const message_events = [
    'MESSAGE_RECEIVED',
    'MESSAGE_SENT',
    'MESSAGE_DELIVERED',
    'MESSAGE_FAILED',
    'UNKNOWN_STATE',
    'SMS_STATUS_UPDATED',
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure your webhook endpoint to receive real-time SMS
            notifications.
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className='w-full justify-between'
                        >
                          {field.value && field.value.length > 0
                            ? `${field.value.length} events selected`
                            : 'Select events to subscribe to'}
                        </Button>
                      </FormControl>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-full'>
                      {message_events.map((event) => (
                        <DropdownMenuCheckboxItem
                          key={event}
                          checked={field.value?.includes(event) || false}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || []
                            const newValues = checked
                              ? [...currentValues, event]
                              : currentValues.filter((v: string) => v !== event)
                            field.onChange(newValues)
                          }}
                          // 👇 prevent menu from closing
                          onSelect={(e) => e.preventDefault()}
                        >
                          {event}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              <Button
               type='submit'
                disabled={createWebhookMutation.isPending}
                >
                {createWebhookMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
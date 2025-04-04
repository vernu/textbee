'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Check, Loader2, MessageSquarePlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'

const SupportFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().optional(),
  category: z.enum(['general', 'technical', 'billing-and-payments', 'other'], {
    message: 'Support category is required',
  }),
  message: z.string().min(1, { message: 'Message is required' }),
})

export default function SupportButton() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(SupportFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      category: 'general',
      message: '',
    },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Use the existing httpBrowserClient to call the NestJS endpoint
      const response = await httpBrowserClient.post(
        ApiEndpoints.support.customerSupport(),
        data
      )

      setIsSubmitSuccessful(true)

      toast({
        title: 'Support request submitted',
        description: response.data.message || 'We will get back to you soon.',
      })

      // Wait 3 seconds before closing the dialog
      setTimeout(() => {
        setOpen(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting support request:', error)

      setErrorMessage(
        'Error submitting support request. Please try again later.'
      )

      toast({
        title: 'Error submitting support request',
        description: 'Please try again later',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      form.reset()
      setIsSubmitSuccessful(false)
      setErrorMessage(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className='fixed bottom-4 right-4 shadow-lg bg-blue-500 hover:bg-blue-600 dark:text-white rounded-full'
          size='sm'
        >
          <MessageSquarePlus className='h-5 w-5 mr-1' />
          <span className='mr-1'>Support</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll get back to you as soon as
            possible.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='category'
              disabled={isSubmitting}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select support category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='general'>General Inquiry</SelectItem>
                      <SelectItem value='technical'>
                        Technical Support
                      </SelectItem>
                      <SelectItem value='billing-and-payments'>
                        Billing and Payments
                      </SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              disabled={isSubmitting}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Your name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              disabled={isSubmitting}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='your@email.com'
                      type='email'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone'
              disabled={isSubmitting}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='+1234567890' type='tel' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='message'
              disabled={isSubmitting}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='How can we help you?'
                      className='min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isSubmitSuccessful && (
              <div className='flex items-center gap-2 text-green-500'>
                <Check className='h-4 w-4' /> We received your message, we will
                get back to you soon.
              </div>
            )}

            {errorMessage && (
              <div className='flex items-center gap-2 text-red-500'>
                <AlertTriangle className='h-4 w-4' /> {errorMessage}
              </div>
            )}
            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />{' '}
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

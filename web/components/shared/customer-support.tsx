'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import axios from 'axios'

const SupportFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().optional(),
  category: z.enum(['general', 'technical'], {
    message: 'Support category is required',
  }),
  message: z.string().min(1, { message: 'Message is required' }),
})

export default function SupportButton() {
  const [open, setOpen] = useState(false)
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
    try {
      const response = await axios.post('/api/customer-support', data)

      const result = response.data

      toast({
        title: 'Support request submitted',
        description: result.message,
      })
    } catch (error) {
      form.setError('root.serverError', {
        message: 'Error submitting support request',
      })
      toast({
        title: 'Error submitting support request',
        description: 'Please try again later',
      })
    }
  }

  const onOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      form.reset()
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
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='category'
              disabled={form.formState.isSubmitting}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    disabled={form.formState.isSubmitting}
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              disabled={form.formState.isSubmitting}
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
              disabled={form.formState.isSubmitting}
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
              disabled={form.formState.isSubmitting}
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
              disabled={form.formState.isSubmitting}
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
            {form.formState.isSubmitSuccessful && (
              <div className='flex items-center gap-2 text-green-500'>
                <Check className='h-4 w-4' /> We received your message, we will
                get back to you soon.
              </div>
            )}

            {form.formState.errors.root?.serverError && (
              <>
                <AlertTriangle className='h-4 w-4' />{' '}
                {form.formState.errors.root.serverError.message}
              </>
            )}
            <Button
              type='submit'
              disabled={form.formState.isSubmitting}
              className='w-full'
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' /> Submitting ...{' '}
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

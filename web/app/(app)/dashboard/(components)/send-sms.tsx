'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendSmsSchema } from '@/lib/schemas'
import type { SendSmsFormData } from '@/lib/schemas'
import { MessageSquare, Send, Plus, X, UserCircle, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'

export default function SendSms() {
  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  const {
    mutate: sendSms,
    isPending: isSendingSms,
    error: sendSmsError,
    isSuccess: isSendSmsSuccess,
  } = useMutation({
    mutationKey: ['send-sms'],
    mutationFn: (data: SendSmsFormData) =>
      httpBrowserClient.post(ApiEndpoints.gateway.sendSMS(data.deviceId), data),
  })

  const { toast } = useToast()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SendSmsFormData>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      deviceId:
        devices?.data?.length === 1 ? devices?.data?.[0]?._id : undefined,
      recipients: [''],
      message: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-expect-error
    name: 'recipients',
  })

  return (
    <div>
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            <CardTitle>Send SMS</CardTitle>
          </div>
          <CardDescription>Send a message to any recipient(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => handleSubmit((data) => sendSms(data))(e)}
            className='space-y-4'
          >
            <div className='space-y-4'>
              <div>
                <Controller
                  name='deviceId'
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a device' />
                      </SelectTrigger>
                      <SelectContent>
                        {devices?.data?.map((device) => (
                          <SelectItem
                            key={device._id}
                            value={device._id}
                            disabled={!device.enabled}
                          >
                            {device.brand} {device.model}{' '}
                            {device.enabled ? '' : '(disabled)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.deviceId && (
                  <p className='text-sm text-destructive mt-1'>
                    {errors.deviceId.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                {fields.map((field, index) => (
                  <div key={field.id}>
                    <div className='flex gap-2'>
                      <Input
                        type='tel'
                        placeholder='Phone Number'
                        {...register(`recipients.${index}`)}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => remove(index)}
                        disabled={index === 0 && fields?.length === 1}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                    {errors.recipients?.[index] && (
                      <p className='text-sm text-destructive'>
                        {errors.recipients[index].message}
                      </p>
                    )}
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => append('')}
                  className='w-full'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Recipient
                </Button>

                {errors.recipients && (
                  <p className='text-sm text-destructive'>
                    {errors.recipients.message}
                  </p>
                )}

                {errors.recipients?.root && (
                  <p className='text-sm text-destructive'>
                    {errors.recipients.root.message}
                  </p>
                )}
              </div>

              <div>
                <Textarea
                  placeholder='Message'
                  {...register('message')}
                  rows={4}
                />
                {errors.message && (
                  <p className='text-sm text-destructive mt-1'>
                    {errors.message.message}
                  </p>
                )}
              </div>
            </div>
            {sendSmsError && (
              <div className='flex items-center gap-2 text-destructive'>
                <p>Error sending SMS: {sendSmsError.message}</p>
                <X className='h-5 w-5' />
              </div>
            )}

            {isSendSmsSuccess && (
              <div className='flex items-center gap-2'>
                <p>SMS sent successfully!</p>
                <Check className='h-5 w-5' />
              </div>
            )}

            <Button type='submit' disabled={isSendingSms} className='w-full'>
              {isSendingSms && (
                <Spinner size='sm' className='mr-2' color='white' />
              )}
              {isSendingSms ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

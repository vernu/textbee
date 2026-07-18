'use client'

import { useEffect, type ComponentType } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendSmsSchema, type SendSmsFormData } from '@/lib/schemas'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/hooks/use-toast'
import { formatError } from '@/lib/utils/errorHandler'
import { formatRateLimitMessageForToast } from '@/components/shared/rate-limit-error'
import { formatDeviceName } from '@/lib/utils'
import { useDevices, useSendSms } from '@/lib/api'
import { getSegmentInfo } from '@/lib/sms'

type SmsComposerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose?: () => void
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  deviceId?: string
  recipient?: string
  submitLabel: string
  successTitle: string
  errorTitle: string
}

// Unified compose-and-send SMS dialog. Replaces the previously duplicated
// ReplyDialog and FollowUpDialog, which differed only by copy and defaults.
export default function SmsComposerDialog({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  icon: Icon,
  deviceId,
  recipient,
  submitLabel,
  successTitle,
  errorTitle,
}: SmsComposerDialogProps) {
  const { data: devices } = useDevices()
  const { mutate: sendSms, isPending: isSendingSms } = useSendSms()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SendSmsFormData>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      deviceId,
      recipients: [recipient ?? ''],
      message: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({ deviceId, recipients: [recipient ?? ''], message: '' })
    }
  }, [open, deviceId, recipient, reset])

  const messageValue = useWatch({ control, name: 'message' }) ?? ''
  const segments = getSegmentInfo(messageValue)

  const onSubmit = (data: SendSmsFormData) =>
    sendSms(data, {
      onSuccess: () => {
        toast({ title: successTitle })
        setTimeout(() => {
          onOpenChange(false)
          onClose?.()
        }, 1500)
      },
      onError: (error: unknown) => {
        const formattedError = formatError(error)
        const description = formattedError.isRateLimit
          ? formatRateLimitMessageForToast(formattedError.rateLimitData)
          : formattedError.message || 'Please try again.'
        toast({ title: errorTitle, description, variant: 'destructive' })
      },
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icon className='h-5 w-5' />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 mt-4'>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='composer-device'>Send from</Label>
              <Controller
                name='deviceId'
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={deviceId}
                  >
                    <SelectTrigger id='composer-device'>
                      <SelectValue placeholder='Select a device' />
                    </SelectTrigger>
                    <SelectContent>
                      {devices?.map((device) => (
                        <SelectItem key={device._id} value={device._id}>
                          {formatDeviceName(device)}{' '}
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
            <div className='space-y-1.5'>
              {/* Real labels, not placeholder-as-label: a placeholder
                  disappears on focus and is not reliably announced. */}
              <Label htmlFor='composer-recipient'>To</Label>
              <Input
                id='composer-recipient'
                type='tel'
                placeholder='+14155550101'
                {...register('recipients.0')}
              />
              {errors.recipients?.[0] && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.recipients[0].message}
                </p>
              )}
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='composer-message'>Message</Label>
              <Textarea
                id='composer-message'
                placeholder='Type your message'
                {...register('message')}
                rows={4}
              />
              <p className='text-xs text-muted-foreground'>
                {segments.length} characters, {segments.segments} segment
                {segments.segments === 1 ? '' : 's'} ({segments.encoding})
              </p>
              {errors.message && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.message.message}
                </p>
              )}
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSendingSms}>
              {isSendingSms && (
                <Spinner size='sm' className='mr-2' color='white' />
              )}
              {isSendingSms ? 'Sending...' : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

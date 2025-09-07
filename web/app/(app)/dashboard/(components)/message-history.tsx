'use client'

import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  Reply,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Check,
  X,
  Smartphone,
  RefreshCw,
  Timer,
  Copy,
  Trash2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendSmsSchema } from '@/lib/schemas'
import type { SendSmsFormData } from '@/lib/schemas'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'

// Helper function to format timestamps
const formatTimestamp = (timestamp: string | null | undefined) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Helper to get status color and icon
const getStatusBadge = (status: string) => {
  const normalizedStatus = status?.toLowerCase() || 'pending'
  switch (normalizedStatus) {
    case 'pending':
      return {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: <Timer className='h-3 w-3' />,
        label: 'Pending',
      }
    case 'sent':
      return {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: <Check className='h-3 w-3' />,
        label: 'Sent',
      }
    case 'delivered':
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <Check className='h-3 w-3' />,
        label: 'Delivered',
      }
    case 'failed':
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: <X className='h-3 w-3' />,
        label: 'Failed',
      }
    default:
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        icon: <Timer className='h-3 w-3' />,
        label: normalizedStatus,
      }
  }
}

function ReplyDialog({ sms, onClose, open, onOpenChange }: { sms: any; onClose?: () => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const {
    mutate: sendSms,
    isPending: isSendingSms,
    isSuccess: isSendSmsSuccess,
  } = useMutation({
    mutationKey: ['send-sms'],
    mutationFn: (data: SendSmsFormData) =>
      httpBrowserClient.post(ApiEndpoints.gateway.sendSMS(data.deviceId), data),
    onSuccess: () => {
      toast.success('SMS sent successfully!')
      setTimeout(() => {
        onOpenChange(false)
        if (onClose) onClose()
      }, 1500)
    },
    onError: (error: any) => {
      toast.error('Failed to send SMS.', {
        description: error.response?.data?.message || 'Please try again.',
      })
    },
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SendSmsFormData>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      deviceId: sms?.device?._id,
      recipients: [sms.sender],
      message: '',
    },
  })

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => httpBrowserClient.get(ApiEndpoints.gateway.listDevices()).then((res) => res.data),
  })

  useEffect(() => {
    if (open) {
      reset({
        deviceId: sms?.device?._id,
        recipients: [sms.sender],
        message: '',
      })
    }
  }, [open, sms, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Reply className='h-5 w-5' />
            Reply to {sms.sender}
          </DialogTitle>
          <DialogDescription>
            Send a reply message to this sender.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => sendSms(data))}
          className='space-y-4 mt-4'
        >
          <div className='space-y-4'>
            <div>
              <Controller
                name='deviceId'
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={sms?.device?._id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select a device' />
                    </SelectTrigger>
                    <SelectContent>
                      {devices?.data?.map((device: any) => (
                        <SelectItem key={device._id} value={device._id}>
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
            <div>
              <Input
                type='tel'
                placeholder='Phone Number'
                {...register('recipients.0')}
              />
              {errors.recipients?.[0] && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.recipients[0].message}
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
              {isSendingSms ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FollowUpDialog({ message, onClose, open, onOpenChange }: { message: any; onClose?: () => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const {
    mutate: sendSms,
    isPending: isSendingSms,
    isSuccess: isSendSmsSuccess,
  } = useMutation({
    mutationKey: ['send-sms'],
    mutationFn: (data: SendSmsFormData) =>
      httpBrowserClient.post(ApiEndpoints.gateway.sendSMS(data.deviceId), data),
    onSuccess: () => {
      toast.success('Follow-up SMS sent successfully!')
      setTimeout(() => {
        onOpenChange(false)
        if (onClose) onClose()
      }, 1500)
    },
    onError: (error: any) => {
      toast.error('Failed to send follow-up SMS.', {
        description: error.response?.data?.message || 'Please try again.',
      })
    },
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SendSmsFormData>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      deviceId: message?.device?._id,
      recipients: [
        message.recipient ||
        (message.recipients && message.recipients[0]) ||
        '',
      ],
      message: '',
    },
  })

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => httpBrowserClient.get(ApiEndpoints.gateway.listDevices()).then((res) => res.data),
  })

  useEffect(() => {
    if (open) {
      reset({
        deviceId: message?.device?._id,
        recipients: [
          message.recipient ||
          (message.recipients && message.recipients[0]) ||
          '',
        ],
        message: '',
      })
    }
  }, [open, message, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Follow Up with{' '}
            {message.recipient ||
              (message.recipients && message.recipients[0]) ||
              'Recipient'}
          </DialogTitle>
          <DialogDescription>
            Send a follow-up message to this recipient.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => sendSms(data))}
          className='space-y-4 mt-4'
        >
          <div className='space-y-4'>
            <div>
              <Controller
                name='deviceId'
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={message?.device?._id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select a device' />
                    </SelectTrigger>
                    <SelectContent>
                      {devices?.data?.map((device: any) => (
                        <SelectItem key={device._id} value={device._id}>
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
            <div>
              <Input
                type='tel'
                placeholder='Phone Number'
                {...register('recipients.0')}
              />
              {errors.recipients?.[0] && (
                <p className='text-sm text-destructive mt-1'>
                  {errors.recipients[0].message}
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
              {isSendingSms ? 'Sending...' : 'Send Follow Up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// New component for full SMS details
function SmsDetailsDialog({
  message,
  open,
  onOpenChange,
}: {
  message: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)

  const statusBadge = getStatusBadge(message?.status)
  const isSent = !!message?.recipient || (message?.recipients && message.recipients.length > 0)

  const handleCopyMessage = () => {
    if (message?.message) {
      navigator.clipboard.writeText(message.message)
      toast.success('Message copied to clipboard!')
    }
  }

  const handleReplyClick = () => {
    onOpenChange(false)
    setIsReplyOpen(true)
  }

  const handleFollowUpClick = () => {
    onOpenChange(false)
    setIsFollowUpOpen(true)
  }

  const handleReplyDialogClose = () => setIsReplyOpen(false)
  const handleFollowUpDialogClose = () => setIsFollowUpOpen(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquare className="h-5 w-5 text-brand-500" />
              SMS Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this SMS message.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-sm">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="font-medium text-muted-foreground">Direction</div>
              <div className="flex items-center gap-1">
                {isSent ? <ArrowUpRight className="h-4 w-4 text-brand-500" /> :
                  <ArrowDownLeft className="h-4 w-4 text-green-500" />}
                <span className="capitalize">{isSent ? 'Sent' : 'Received'}</span>
              </div>

              <div className="font-medium text-muted-foreground">Number</div>
              <div>
                {isSent ? message.recipient || message.recipients?.[0] || 'Unknown'
                        : message.sender || 'Unknown'}
              </div>

              <div className="font-medium text-muted-foreground">Status</div>
              <div>
                <Badge variant="outline" className={`${statusBadge.color} flex items-center text-xs`}>
                  {statusBadge.icon}
                  {statusBadge.label}
                </Badge>
              </div>

              <div className="font-medium text-muted-foreground">Date & Time</div>
              <div>{formatTimestamp(isSent ? message.requestedAt : message.receivedAt)}</div>

              <div className="font-medium text-muted-foreground">Device</div>
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                {message.device?.brand || 'N/A'} {message.device?.model || ''}
              </div>

              {message.gatewayMessageId && (
                <>
                  <div className="font-medium text-muted-foreground">Gateway ID</div>
                  <div className="font-mono text-xs break-all">{message.gatewayMessageId}</div>
                </>
              )}

              {message.errorMessage && (
                <>
                  <div className="font-medium text-muted-foreground">Error</div>
                  <div className="text-destructive text-sm">{message.errorMessage}</div>
                </>
              )}
            </div>

            {/* Message Body */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Message Body</h4>
              <div className="max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm break-words">
                {message.message}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-border">
              {!isSent && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={handleReplyClick}>
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
              )}
              {isSent && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={handleFollowUpClick}>
                  <MessageSquare className="h-4 w-4" />
                  Follow Up
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleCopyMessage}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              {/* Optional Delete */}
              {/* <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button> */}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {message && isReplyOpen && (
        <ReplyDialog sms={message} open={isReplyOpen} onOpenChange={handleReplyDialogClose} />
      )}
      {message && isFollowUpOpen && (
        <FollowUpDialog message={message} open={isFollowUpOpen} onOpenChange={handleFollowUpDialogClose} />
      )}
    </>
  )
}

function MessageCard({ message, type, device, onSelectMessage }) {
  const isSent = type === 'sent'

  const formattedDate = formatTimestamp(
    (isSent ? message.requestedAt : message.receivedAt) || message.createdAt
  )
  const statusBadge = getStatusBadge(message.status)

  // Condition to show status badge based on device app version and message date
  const shouldShowStatus = device?.appVersionCode >= 14 && new Date(message?.createdAt) > new Date('2025-06-05')

  return (
    <Card
      className={`hover:bg-muted/50 transition-colors cursor-pointer max-w-sm md:max-w-none ${
        isSent ? 'border-l-4 border-l-brand-500' : 'border-l-4 border-l-green-500'
      }`}
      onClick={() => onSelectMessage(message)}
    >
      <CardContent className='p-4'>
        <div className='space-y-3'>
          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-2'>
              {isSent ? (
                <div className='flex items-center text-brand-600 dark:text-brand-400 font-medium'>
                  <ArrowUpRight className='h-4 w-4 mr-1' />
                  <span>
                    To:{' '}
                    {message.recipient ||
                      (message.recipients && message.recipients[0]) ||
                      'Unknown'}
                  </span>
                </div>
              ) : (
                <div className='flex items-center text-green-600 dark:text-green-400 font-medium'>
                  <ArrowDownLeft className='h-4 w-4 mr-1' />
                  <span>From: {message.sender || 'Unknown'}</span>
                </div>
              )}
            </div>
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              <Clock className='h-3 w-3' />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className='flex gap-2'>
            <p className='text-sm max-w-sm md:max-w-none line-clamp-2'>{message.message}</p>
          </div>

          <div className='flex justify-between items-center'>
            {isSent && shouldShowStatus && (
              <Badge variant='outline' className={`${statusBadge.color} flex items-center text-xs`}>
                {statusBadge.icon}
                {statusBadge.label}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MessageCardSkeleton() {
  return (
    <Card className='hover:bg-muted/50 transition-colors max-w-sm md:max-w-none'>
      <CardContent className='p-4'>
        <div className='space-y-3'>
          <div className='flex justify-between items-start'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-4 w-32' />
          </div>
          <Skeleton className='h-4 w-full' />
        </div>
      </CardContent>
    </Card>
  )
}

export default function MessageHistory() {
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const handleSelectMessage = (message: any) => {
    setSelectedMessage(message)
    setIsDetailsDialogOpen(true)
  }

  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError,
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () => httpBrowserClient.get(ApiEndpoints.gateway.listDevices()).then((res) => res.data),
  })

  const [currentDevice, setCurrentDevice] = useState('')
  const [messageType, setMessageType] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (devices?.data?.length && !currentDevice) {
      setCurrentDevice(devices.data[0]._id)
    }
  }, [devices, currentDevice])

  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch,
  } = useQuery({
    queryKey: ['messages-history', currentDevice, messageType, page, limit],
    enabled: !!currentDevice,
    queryFn: () =>
      httpBrowserClient
        .get(
          `${ApiEndpoints.gateway.getMessages(
            currentDevice
          )}?type=${messageType}&page=${page}&limit=${limit}`
        )
        .then((res) => res.data),
  })

  const handleRefresh = async () => {
    if (!currentDevice) return
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    if (autoRefreshInterval > 0 && currentDevice) {
      refreshTimerRef.current = setInterval(() => {
        refetch()
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 300)
      }, autoRefreshInterval * 1000)
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefreshInterval, currentDevice, messageType, page, limit, refetch])

  const messages = messagesResponse?.data || []

  const pagination = messagesResponse?.meta || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  }

  const handleDeviceChange = (deviceId: string) => {
    setCurrentDevice(deviceId)
    setPage(1)
  }

  const handleMessageTypeChange = (type: string) => {
    setMessageType(type)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  if (isLoadingDevices)
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <MessageCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )

  if (devicesError)
    return (
      <div className='flex justify-center items-center h-full'>
        Error: {devicesError.message}
      </div>
    )

  if (!devices?.data?.length)
    return (
      <div className='flex justify-center items-center h-full'>
        No devices found
      </div>
    )

  return (
    <div className='space-y-4'>
      <div className='bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-950/30 dark:to-sky-950/30 rounded-lg shadow-sm border border-brand-100 dark:border-brand-800/50 p-4 mb-4'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1.5'>
                <Smartphone className='h-3.5 w-3.5 text-brand-500' />
                <h3 className='text-sm font-medium text-foreground'>Device</h3>
              </div>
              <Select value={currentDevice} onValueChange={handleDeviceChange}>
                <SelectTrigger className='w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70'>
                  <SelectValue placeholder='Select a device' />
                </SelectTrigger>
                <SelectContent>
                  {devices?.data?.map((device: any) => (
                    <SelectItem key={device._id} value={device._id}>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>
                          {device.brand} {device.model}
                        </span>
                        {!device.enabled && (
                          <Badge
                            variant='outline'
                            className='ml-1 text-xs py-0 h-5'
                          >
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='w-full sm:w-44'>
              <div className='flex items-center gap-2 mb-1.5'>
                <MessageSquare className='h-3.5 w-3.5 text-brand-500' />
                <h3 className='text-sm font-medium text-foreground'>
                  Message Type
                </h3>
              </div>
              <Select
                value={messageType}
                onValueChange={handleMessageTypeChange}
              >
                <SelectTrigger className='w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70'>
                  <SelectValue placeholder='Message type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    <div className='flex items-center gap-1.5'>
                      <div className='h-1.5 w-1.5 rounded-full bg-gray-500'></div>
                      All Messages
                    </div>
                  </SelectItem>
                  <SelectItem value='received'>
                    <div className='flex items-center gap-1.5'>
                      <div className='h-1.5 w-1.5 rounded-full bg-green-500'></div>
                      Received
                    </div>
                  </SelectItem>
                  <SelectItem value='sent'>
                    <div className='flex items-center gap-1.5'>
                      <div className='h-1.5 w-1.5 rounded-full bg-brand-500'></div>
                      Sent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center justify-between gap-2 pt-2 mt-2 border-t border-brand-100 dark:border-brand-800/50'>
            <div className='flex items-center gap-1.5'>
              <Button
                onClick={handleRefresh}
                variant='ghost'
                size='sm'
                disabled={!currentDevice}
                className='h-7 px-2 text-xs text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/30'
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                Refresh Now
              </Button>
            </div>

            <div className='flex items-center gap-1.5'>
              <Timer className='h-3 w-3 text-brand-500' />
              <span className='text-xs font-medium mr-1'>Auto Refresh:</span>
              <div className='flex'>
                {[
                  { value: 0, label: 'Off' },
                  { value: 15, label: '15s' },
                  { value: 30, label: '30s' },
                  { value: 60, label: '60s' },
                ].map((interval) => (
                  <Button
                    key={interval.value}
                    size='sm'
                    variant='ghost'
                    disabled={!currentDevice && interval.value > 0}
                    className={`h-6 px-1.5 text-xs ${
                      autoRefreshInterval === interval.value
                        ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium'
                        : 'text-muted-foreground hover:bg-brand-50 dark:hover:bg-brand-900/20'
                    }`}
                    onClick={() => setAutoRefreshInterval(interval.value)}
                  >
                    {interval.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoadingMessages && (
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <MessageCardSkeleton key={i} />
          ))}
        </div>
      )}

      {messagesError && (
        <div className='flex justify-center items-center h-full'>
          Error: {messagesError.message}
        </div>
      )}

      {!isLoadingMessages && messages.length === 0 && (
        <div className='flex justify-center items-center h-full py-10'>
          No messages found
        </div>
      )}

      <div className='space-y-4'>
        {messages?.map((message: any) => (
          <MessageCard
            key={message._id}
            message={message}
            type={message.sender ? 'received' : 'sent'}
            device={devices?.data?.find((device: any) => device._id === currentDevice)}
            onSelectMessage={handleSelectMessage}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className='flex justify-center mt-6 space-x-2'>
          <Button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            variant={page === 1 ? 'ghost' : 'default'}
          >
            Previous
          </Button>

          <div className='flex flex-wrap items-center gap-2 justify-center sm:justify-start'>
            {pagination.totalPages > 1 && (
              <Button
                onClick={() => handlePageChange(1)}
                variant={page === 1 ? 'default' : 'ghost'}
                size='icon'
                className={`h-8 w-8 rounded-full ${
                  page === 1
                    ? 'bg-primary text-brand-foreground hover:bg-primary/90'
                    : 'hover:bg-secondary'
                }`}
              >
                1
              </Button>
            )}

            {page > 4 && pagination.totalPages > 7 && (
              <span className='px-1'>...</span>
            )}

            {Array.from(
              { length: Math.min(6, pagination.totalPages - 2) },
              (_, i) => {
                let pageToShow
                if (pagination.totalPages <= 8) {
                  pageToShow = i + 2
                } else if (page <= 4) {
                  pageToShow = i + 2
                } else if (page >= pagination.totalPages - 3) {
                  pageToShow = pagination.totalPages - 7 + i
                } else {
                  pageToShow = page - 2 + i
                }

                if (pageToShow > 1 && pageToShow < pagination.totalPages) {
                  return (
                    <Button
                      key={pageToShow}
                      onClick={() => handlePageChange(pageToShow)}
                      variant={page === pageToShow ? 'default' : 'ghost'}
                      size='icon'
                      className={`h-8 w-8 rounded-full ${
                        page === pageToShow
                          ? 'bg-primary text-brand-foreground hover:bg-primary/90'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {pageToShow}
                    </Button>
                  )
                }
                return null
              }
            )}

            {page < pagination.totalPages - 3 && pagination.totalPages > 7 && (
              <span className='px-1'>...</span>
            )}

            {pagination.totalPages > 1 && (
              <Button
                onClick={() => handlePageChange(pagination.totalPages)}
                variant={page === pagination.totalPages ? 'default' : 'ghost'}
                size='icon'
                className={`h-8 w-8 rounded-full ${
                  page === pagination.totalPages
                    ? 'bg-primary text-brand-foreground hover:bg-primary/90'
                    : 'hover:bg-secondary'
                }`}
              >
                {pagination.totalPages}
              </Button>
            )}
          </div>
          <Button
            onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            variant={page === pagination.totalPages ? 'ghost' : 'default'}
          >
            Next
          </Button>
        </div>
      )}
      {selectedMessage && (
        <SmsDetailsDialog
          message={selectedMessage}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </div>
  )
}

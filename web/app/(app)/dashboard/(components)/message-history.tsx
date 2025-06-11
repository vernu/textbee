'use client'

import { useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { useMutation } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

function ReplyDialog({ sms, onClose }: { sms: any; onClose?: () => void }) {
  const [open, setOpen] = useState(false)

  const {
    mutate: sendSms,
    isPending: isSendingSms,
    error: sendSmsError,
    isSuccess: isSendSmsSuccess,
  } = useMutation({
    mutationKey: ['send-sms'],
    mutationFn: (data: SendSmsFormData) =>
      httpBrowserClient.post(ApiEndpoints.gateway.sendSMS(data.deviceId), data),
    onSuccess: () => {
      setTimeout(() => {
        setOpen(false)
        if (onClose) onClose()
      }, 1500)
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

  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1'>
          <Reply className='h-3.5 w-3.5' />
          Reply
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Reply to {sms.sender}
          </DialogTitle>
          <DialogDescription>
            Send a reply message to this sender
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => handleSubmit((data) => sendSms(data))(e)}
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
                      {devices?.data?.map((device) => (
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
          {sendSmsError && (
            <div className='flex items-center gap-2 text-destructive'>
              <p>Error sending SMS: {sendSmsError.message}</p>
              <X className='h-5 w-5' />
            </div>
          )}

          {isSendSmsSuccess && (
            <div className='flex items-center gap-2 text-green-600'>
              <p>SMS sent successfully!</p>
              <Check className='h-5 w-5' />
            </div>
          )}

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
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

function FollowUpDialog({
  message,
  onClose,
}: {
  message: any
  onClose?: () => void
}) {
  const [open, setOpen] = useState(false)

  const {
    mutate: sendSms,
    isPending: isSendingSms,
    error: sendSmsError,
    isSuccess: isSendSmsSuccess,
  } = useMutation({
    mutationKey: ['send-sms'],
    mutationFn: (data: SendSmsFormData) =>
      httpBrowserClient.post(ApiEndpoints.gateway.sendSMS(data.deviceId), data),
    onSuccess: () => {
      setTimeout(() => {
        setOpen(false)
        if (onClose) onClose()
      }, 1500)
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

  const { data: devices, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1'>
          <MessageSquare className='h-3.5 w-3.5' />
          Follow Up
        </Button>
      </DialogTrigger>
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
            Send a follow-up message to this recipient
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => handleSubmit((data) => sendSms(data))(e)}
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
                      {devices?.data?.map((device) => (
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
          {sendSmsError && (
            <div className='flex items-center gap-2 text-destructive'>
              <p>Error sending SMS: {sendSmsError.message}</p>
              <X className='h-5 w-5' />
            </div>
          )}

          {isSendSmsSuccess && (
            <div className='flex items-center gap-2 text-green-600'>
              <p>SMS sent successfully!</p>
              <Check className='h-5 w-5' />
            </div>
          )}

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
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

function StatusDetailsDialog({ message }: { message: any }) {
  const [open, setOpen] = useState(false);
  
  // Format timestamps for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Get status badge color and icon based on message status
  const getStatusBadge = () => {
    const status = message.status || 'pending';
    
    switch (status) {
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          icon: <Timer className="h-3 w-3 mr-1" />,
          label: 'Pending'
        };
      case 'SENT':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          icon: <Check className="h-3 w-3 mr-1" />,
          label: 'Sent'
        };
      case 'DELIVERED':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          icon: <Check className="h-3 w-3 mr-1" />,
          label: 'Delivered'
        };
      case 'FAILED':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          icon: <X className="h-3 w-3 mr-1" />,
          label: 'Failed'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          icon: <Timer className="h-3 w-3 mr-1" />,
          label: status
        };
    }
  };

  const statusBadge = getStatusBadge();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge variant="outline" className={`${statusBadge.color} flex items-center text-xs cursor-pointer`}>
          {statusBadge.icon}
          {statusBadge.label}
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Status Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this SMS message
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Status</div>
            <div>{message.status || 'pending'}</div>
            
            <div className="font-medium">Requested At</div>
            <div>{formatTimestamp(message.requestedAt)}</div>
            
            <div className="font-medium">Sent At</div>
            <div>{formatTimestamp(message.sentAt)}</div>
            
            <div className="font-medium">Delivered At</div>
            <div>{formatTimestamp(message.deliveredAt)}</div>
            
            {message.status === 'FAILED' && (
              <>
                <div className="font-medium">Failed At</div>
                <div>{formatTimestamp(message.failedAt)}</div>
                
                {message.errorCode && (
                  <>
                    <div className="font-medium">Error Code</div>
                    <div className="">{message.errorCode}</div>
                  </>
                )}
                
                {message.errorMessage && (
                  <>
                    <div className="font-medium">Error Message</div>
                    <div className="">{message.errorMessage}</div>
                  </>
                )}
                
                {(!message.errorCode && !message.errorMessage && message.error) && (
                  <>
                    <div className="font-medium">Error</div>
                    <div className="text-destructive">{message.error || 'Unknown error'}</div>
                  </>
                )}
              </>
            )}
            
            <div className="font-medium">Recipient</div>
            <div>{message.recipient || (message.recipients && message.recipients[0]) || 'Unknown'}</div>
            
            <div className="font-medium">Message ID</div>
            <div className="font-mono text-xs">{message._id}</div>
            
            {message.smsBatch && (
              <>
                <div className="font-medium">Batch ID</div>
                <div className="font-mono text-xs">{message.smsBatch}</div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageCard({ message, type, device }) {
  const isSent = type === 'sent'

  const formattedDate = new Date(
    (isSent ? message.requestedAt : message.receivedAt) || message.createdAt
  ).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const shouldShowStatus = device?.appVersionCode >= 14 &&  new Date(message?.createdAt) > new Date('2025-06-05')

  return (
    <Card
      className={`hover:bg-muted/50 transition-colors max-w-sm md:max-w-none ${
        isSent
          ? 'border-l-4 border-l-brand-500'
          : 'border-l-4 border-l-green-500'
      }`}
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
            <p className='text-sm max-w-sm md:max-w-none'>{message.message}</p>
          </div>

          <div className='flex justify-between items-center'>
            {isSent && shouldShowStatus && (
              <div className='flex items-center'>
                <StatusDetailsDialog message={message} />
              </div>
            )}
            
            <div className='flex justify-end ml-auto'>
              {!isSent && <ReplyDialog sms={message} />}
              {isSent && <FollowUpDialog message={message} />}
            </div>
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
  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError,
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  const [currentDevice, setCurrentDevice] = useState('')
  const [messageType, setMessageType] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0) // 0 means no auto-refresh
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimerRef = useRef(null)

  useEffect(() => {
    if (devices?.data?.length) {
      setCurrentDevice(devices?.data?.[0]?._id)
    }
  }, [devices])

  // Query for messages with type filter
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

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!currentDevice) return // Don't refresh if no device is selected

    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500) // Show refresh animation for at least 500ms
  }

  // Setup auto-refresh timer
  useEffect(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    // Set up new timer if interval > 0
    if (autoRefreshInterval > 0 && currentDevice) {
      refreshTimerRef.current = setInterval(() => {
        refetch()
        // Brief visual feedback that refresh happened
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 300)
      }, autoRefreshInterval * 1000)
    }

    // Cleanup on unmount
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

  const handleDeviceChange = (deviceId) => {
    setCurrentDevice(deviceId)
    setPage(1)
  }

  const handleMessageTypeChange = (type) => {
    setMessageType(type)
    setPage(1)
  }

  const handlePageChange = (newPage) => {
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
                  {devices?.data?.map((device) => (
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

          {/* Refresh Controls */}
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

              {/* {messagesResponse && (
                <span className='text-xs text-muted-foreground hidden sm:inline-block'>
                  Updated: {new Date().toLocaleTimeString()}
                </span>
              )} */}
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

      {!isLoadingDevices && !messages && (
        <div className='flex justify-center items-center h-full py-10'>
          No messages found
        </div>
      )}

      <div className='space-y-4'>
        {messages?.map((message) => (
          <MessageCard
            key={message._id}
            message={message}
            type={message.sender ? 'received' : 'sent'}
            device={devices?.data?.find((device) => device._id === currentDevice)}
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
            {/* First page */}
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

            {/* Ellipsis if needed */}
            {page > 4 && pagination.totalPages > 7 && (
              <span className='px-1'>...</span>
            )}

            {/* Middle pages */}
            {Array.from(
              { length: Math.min(6, pagination.totalPages - 2) },
              (_, i) => {
                let pageToShow

                if (pagination.totalPages <= 8) {
                  // If we have 8 or fewer pages, show pages 2 through 7 (or fewer)
                  pageToShow = i + 2
                } else if (page <= 4) {
                  // Near the start
                  pageToShow = i + 2
                } else if (page >= pagination.totalPages - 3) {
                  // Near the end
                  pageToShow = pagination.totalPages - 7 + i
                } else {
                  // Middle - center around current page
                  pageToShow = page - 2 + i
                }

                // Ensure page is within bounds and not the first or last page
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

            {/* Ellipsis if needed */}
            {page < pagination.totalPages - 3 && pagination.totalPages > 7 && (
              <span className='px-1'>...</span>
            )}

            {/* Last page */}
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
            onClick={() =>
              handlePageChange(Math.min(pagination.totalPages, page + 1))
            }
            disabled={page === pagination.totalPages}
            variant={page === pagination.totalPages ? 'ghost' : 'default'}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

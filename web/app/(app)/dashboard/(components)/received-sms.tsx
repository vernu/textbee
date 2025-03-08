import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, MessageSquare, Reply } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendSmsSchema } from '@/lib/schemas'
import type { SendSmsFormData } from '@/lib/schemas'
import { useMutation } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import { Check, X } from 'lucide-react'

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

export function ReceivedSmsCard({ sms }) {
  const formattedDate = new Date(sms.receivedAt).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card className='hover:bg-muted/50 transition-colors max-w-sm md:max-w-none'>
      <CardContent className='p-4'>
        <div className='space-y-3'>
          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-2'>
              <span className='font-medium'>{sms.sender}</span>
            </div>
            <div className='flex items-center gap-1 text-sm text-muted-foreground'>
              <Clock className='h-3 w-3' />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className='flex gap-2'>
            <p className='text-sm max-w-sm md:max-w-none'>{sms.message}</p>
          </div>

          <div className='flex justify-end'>
            <ReplyDialog sms={sms} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReceivedSmsCardSkeleton() {
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

export default function ReceivedSms() {
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

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab)
    setPage(1)
  }

  const [currentTab, setCurrentTab] = useState('')

  useEffect(() => {
    if (devices?.data?.length) {
      setCurrentTab(devices?.data?.[0]?._id)
    }
  }, [devices])

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const {
    data: receivedSmsResponse,
    isLoading: isLoadingReceivedSms,
    error: receivedSmsError,
  } = useQuery({
    queryKey: ['received-sms', currentTab, page, limit],
    enabled: !!currentTab,
    queryFn: () =>
      httpBrowserClient
        .get(
          `${ApiEndpoints.gateway.getReceivedSMS(
            currentTab
          )}?page=${page}&limit=${limit}`
        )
        .then((res) => res.data),
  })

  const receivedSms = receivedSmsResponse?.data || []
  const pagination = receivedSmsResponse?.meta || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
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
            <ReceivedSmsCardSkeleton key={i} />
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
    <div>
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className='space-y-4'
      >
        <TabsList className='flex'>
          {devices?.data?.map((device) => (
            <TabsTrigger key={device._id} value={device._id} className='flex-1'>
              {device.brand} {device.model}
            </TabsTrigger>
          ))}
        </TabsList>

        {devices?.data?.map((device) => (
          <TabsContent
            key={device._id}
            value={device._id}
            className='space-y-4'
          >
            {isLoadingReceivedSms && (
              <div className='space-y-4'>
                {[1, 2, 3].map((i) => (
                  <ReceivedSmsCardSkeleton key={i} />
                ))}
              </div>
            )}
            {receivedSmsError && (
              <div className='flex justify-center items-center h-full'>
                Error: {receivedSmsError.message}
              </div>
            )}
            {!isLoadingReceivedSms && !receivedSms?.length && (
              <div className='flex justify-center items-center h-full'>
                No messages found
              </div>
            )}

            {receivedSms?.map((sms) => (
              <ReceivedSmsCard key={sms._id} sms={sms} />
            ))}

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
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
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
                      if (
                        pageToShow > 1 &&
                        pageToShow < pagination.totalPages
                      ) {
                        return (
                          <Button
                            key={pageToShow}
                            onClick={() => handlePageChange(pageToShow)}
                            variant={page === pageToShow ? 'default' : 'ghost'}
                            size='icon'
                            className={`h-8 w-8 rounded-full ${
                              page === pageToShow
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
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
                  {page < pagination.totalPages - 3 &&
                    pagination.totalPages > 7 && (
                      <span className='px-1'>...</span>
                    )}

                  {/* Last page */}
                  {pagination.totalPages > 1 && (
                    <Button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      variant={
                        page === pagination.totalPages ? 'default' : 'ghost'
                      }
                      size='icon'
                      className={`h-8 w-8 rounded-full ${
                        page === pagination.totalPages
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

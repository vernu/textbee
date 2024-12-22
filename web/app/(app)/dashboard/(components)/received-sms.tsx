import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

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
  }

  const [currentTab, setCurrentTab] = useState('')

  useEffect(() => {
    if (devices?.data?.length) {
      setCurrentTab(devices?.data?.[0]?._id)
    }
  }, [devices])

  const {
    data: receivedSms,
    isLoading: isLoadingReceivedSms,
    error: receivedSmsError,
  } = useQuery({
    queryKey: ['received-sms', currentTab],
    enabled: !!currentTab,
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.getReceivedSMS(currentTab))
        .then((res) => res.data),
  })

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
            {!isLoadingReceivedSms && !receivedSms?.data?.length && (
              <div className='flex justify-center items-center h-full'>
                No messages found
              </div>
            )}

            {receivedSms?.data?.map((sms) => (
              <ReceivedSmsCard key={sms._id} sms={sms} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

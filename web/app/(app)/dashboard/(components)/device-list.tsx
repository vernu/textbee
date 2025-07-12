'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Smartphone, Battery, Signal, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

export default function DeviceList() {
  const { toast } = useToast()
  const {
    isPending,
    error,
    data: devices,
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
    // select: (res) => res.data,
  })

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({
      title: 'Device ID copied to clipboard',
    })
  }

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg'>Registered Devices</CardTitle>
      </CardHeader>
      <CardContent>
          <div className='space-y-2'>
            {isPending && (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className='border-0 shadow-none'>
                    <CardContent className='flex items-center p-3'>
                      <Skeleton className='h-6 w-6 rounded-full mr-3' />
                      <div className='flex-1'>
                        <div className='flex items-center justify-between'>
                          <Skeleton className='h-4 w-[120px]' />
                          <Skeleton className='h-4 w-[60px]' />
                        </div>
                        <div className='flex items-center space-x-2 mt-1'>
                          <Skeleton className='h-4 w-[180px]' />
                        </div>
                        <div className='flex items-center mt-1 space-x-3'>
                          <Skeleton className='h-3 w-[200px]' />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {error && (
              <div className='flex justify-center items-center h-full'>
                <div>Error: {error.message}</div>
              </div>
            )}

            {!isPending && !error && devices?.data?.length === 0 && (
              <div className='flex justify-center items-center h-full'>
                <div>No devices found</div>
              </div>
            )}

            {devices?.data?.map((device) => (
              <Card key={device._id} className='border-0 shadow-none'>
                <CardContent className='flex items-center p-3'>
                  <Smartphone className='h-6 w-6 mr-3' />
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-semibold text-sm'>
                        {device.brand} {device.model}
                      </h3>
                      <Badge
                        variant={
                          device.status === 'online' ? 'default' : 'secondary'
                        }
                        className='text-xs'
                      >
                        {device.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className='flex items-center space-x-2 mt-1'>
                      <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs'>
                        {device._id}
                      </code>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6'
                        onClick={() => handleCopyId(device._id)}
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                    <div className='flex items-center mt-1 space-x-3 text-xs text-muted-foreground'>
                      <div className='flex items-center'>
                        <Battery className='h-3 w-3 mr-1' />
                        unknown
                      </div>
                      <div className='flex items-center'>
                        <Signal className='h-3 w-3 mr-1' />-
                      </div>
                      <div>
                        Registered at:{' '}
                        {new Date(device.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      </CardContent>
    </Card>
  )
}

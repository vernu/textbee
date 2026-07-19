'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Smartphone,
  Copy,
  Plus,
  ExternalLink,
  Loader2,
  MoreVertical,
  TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Routes } from '@/config/routes'
import { useDeleteDevice, useDevices, useSubscription } from '@/lib/api'
import EmptyState from '@/components/shared/empty-state'
import ErrorState from '@/components/shared/error-state'
import RelativeTime from '@/components/shared/relative-time'
import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDeviceName } from '@/lib/utils'
import AddDeviceDialog, { type AddDeviceHandle } from './add-device-dialog'
import {
  DeviceVersionCandidate,
  getDeviceVersionCode,
  isDeviceOutdated,
  latestAppVersionCode,
} from './update-app-helpers'

type DeviceRow = DeviceVersionCandidate & {
  createdAt: string
  enabled?: boolean
}

export default function DeviceList() {
  const addDeviceRef = useRef<AddDeviceHandle>(null)
  const [devicePendingDelete, setDevicePendingDelete] =
    useState<DeviceRow | null>(null)
  const { toast } = useToast()
  const { isPending, error, data: devices, refetch } = useDevices()

  const { data: currentSubscription } = useSubscription()

  // -1 (or missing) means unlimited; only enabled devices count toward the limit
  const deviceLimit = currentSubscription?.usage?.deviceLimit ?? -1
  const activeDeviceCount =
    devices?.filter((device) => device.enabled).length ?? 0
  const isDeviceLimitReached =
    deviceLimit !== -1 && !isPending && activeDeviceCount >= deviceLimit
  const isApproachingDeviceLimit =
    deviceLimit >= 2 && !isPending && activeDeviceCount === deviceLimit - 1

  const { mutate: deleteDevice, isPending: isDeletingDevice } = useDeleteDevice()

  const handleDeleteDevice = (id: string) =>
    deleteDevice(id, {
      onSuccess: () => {
        setDevicePendingDelete(null)
        toast({ title: 'Device removed' })
      },
      onError: (err: unknown) => {
        const message =
          err &&
          typeof err === 'object' &&
          'message' in err &&
          typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Something went wrong'
        toast({
          variant: 'destructive',
          title: 'Error removing device',
          description: message,
        })
      },
    })

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({
      title: 'Device ID copied to clipboard',
    })
  }

  return (
    <>
      <AddDeviceDialog ref={addDeviceRef} />
      <Card className='min-w-0 max-w-full'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg'>
            Registered Devices
            {!isPending && !error && (
              <span className='ml-2 text-sm font-normal text-muted-foreground'>
                {devices?.length ?? 0}
              </span>
            )}
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            onClick={() => addDeviceRef.current?.open()}
          >
            <Plus className='mr-1 h-4 w-4' />
            Add device
          </Button>
        </CardHeader>
      <CardContent>
          {(isDeviceLimitReached || isApproachingDeviceLimit) && (
            <div
              className={`mb-4 flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${
                isDeviceLimitReached
                  ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
                  : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
              }`}
            >
              <div className='flex items-start gap-2'>
                <TriangleAlert
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isDeviceLimitReached
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                />
                <p className='text-xs text-muted-foreground'>
                  {isDeviceLimitReached ? (
                    <>
                      You've reached your plan's limit of{' '}
                      <span className='font-medium text-foreground'>
                        {deviceLimit} active device{deviceLimit === 1 ? '' : 's'}
                      </span>
                      . New devices can't be registered or re-enabled.
                    </>
                  ) : (
                    <>
                      You're using{' '}
                      <span className='font-medium text-foreground'>
                        {activeDeviceCount} of {deviceLimit}
                      </span>{' '}
                      active devices included in your plan.
                    </>
                  )}
                </p>
              </div>
              <Button variant='outline' size='sm' asChild className='shrink-0'>
                <Link href='/pricing'>Upgrade plan</Link>
              </Button>
            </div>
          )}
          <div className='space-y-2'>
            {isPending && (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className='border-0 shadow-none'>
                    <CardContent className='flex items-center p-3'>
                      <Skeleton className='h-6 w-6 rounded-full mr-3 shrink-0' />
                      <div className='min-w-0 flex-1'>
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
                      <Skeleton className='h-6 w-6 shrink-0' />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {error && (
              <ErrorState
                error={error}
                title="Couldn't load your devices"
                icon={Smartphone}
                onRetry={() => refetch()}
              />
            )}

            {!isPending && !error && devices?.length === 0 && (
              <EmptyState
                icon={Smartphone}
                title='No devices found'
                hint='Install the app on your phone and add it as a device to get started.'
              />
            )}

            {devices?.map((device) => (
              <Card key={device._id} className='border-0 shadow-none'>
                <CardContent className='flex items-center gap-1 p-3'>
                  <Smartphone className='h-6 w-6 mr-2 shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-semibold text-sm'>
                        {formatDeviceName(device)}
                      </h3>
                      <div className='flex items-center gap-2'>
                        {isDeviceOutdated(device as DeviceVersionCandidate) && (
                          <Badge
                            variant='outline'
                            className='border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          >
                            Update available
                          </Badge>
                        )}
                        {/* Colour and text now come from the same field. The
                            variant used to key off device.status, which the
                            API never sends, so an enabled device was styled
                            identically to a disabled one. */}
                        <Badge
                          variant={device.enabled ? 'default' : 'secondary'}
                          className='text-xs'
                        >
                          {device.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2 mt-1'>
                      <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs'>
                        {device._id}
                      </code>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6'
                        aria-label='Copy device ID'
                        title='Copy device ID'
                        onClick={() => handleCopyId(device._id)}
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                    {/* No battery or signal indicators: the app does not
                        report either, so they only ever rendered "unknown"
                        and "-" next to a meaningful-looking icon. */}
                    <div className='flex items-center mt-1 space-x-3 text-xs text-muted-foreground'>
                      <div>
                        App version:{' '}
                        {getDeviceVersionCode(device as DeviceVersionCandidate) ??
                          'unknown'}
                      </div>
                      <div>
                        Registered <RelativeTime value={device.createdAt} />
                      </div>
                    </div>
                    {isDeviceOutdated(device as DeviceVersionCandidate) && (
                      <div className='mt-3 flex items-center justify-between gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 dark:border-brand-900/50 dark:bg-brand-950/20'>
                        <p className='text-xs text-muted-foreground'>
                          This device is behind the latest supported version{' '}
                          <span className='font-medium text-foreground'>
                            {latestAppVersionCode}
                          </span>
                          .
                        </p>
                        <Button
                          variant='outline'
                          size='sm'
                          asChild
                          className='shrink-0'
                        >
                          <a
                            href={Routes.downloadAndroidApp}
                            target='_blank'
                            rel='noreferrer'
                          >
                            Update app
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 shrink-0'
                        aria-label='Device actions'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        onClick={() =>
                          setDevicePendingDelete(device as DeviceRow)
                        }
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
      </CardContent>
      </Card>


      <Dialog
        open={!!devicePendingDelete}
        onOpenChange={(open) => {
          if (!open) setDevicePendingDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this device?</DialogTitle>
            <DialogDescription>
              {devicePendingDelete
                ? `This removes ${formatDeviceName(devicePendingDelete)} from your account. You will not be able to send or receive SMS through it until you register the app again.`
                : 'This removes the device from your account. You will not be able to send or receive SMS through it until you register the app again.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDevicePendingDelete(null)}
              disabled={isDeletingDevice}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() =>
                devicePendingDelete &&
                handleDeleteDevice(devicePendingDelete._id)
              }
              disabled={isDeletingDevice}
            >
              {isDeletingDevice ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

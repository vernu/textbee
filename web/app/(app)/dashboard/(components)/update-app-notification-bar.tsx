'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, BellRing } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ApiEndpoints } from '@/config/api'
import { Routes } from '@/config/routes'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { formatDeviceName } from '@/lib/utils'
import {
  DeviceVersionCandidate,
  getOutdatedDevices,
  latestAppVersionCode,
  summarizeOutdatedDeviceNames,
} from './update-app-helpers'

export default function UpdateAppNotificationBar() {
  const { data: devicesResponse, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  const outdatedDevices = useMemo(
    () =>
      getOutdatedDevices(
        (devicesResponse?.data ?? []) as DeviceVersionCandidate[]
      ),
    [devicesResponse?.data]
  )

  const primaryOutdatedDevice = outdatedDevices[0]

  if (isLoading || error || !primaryOutdatedDevice) {
    return null
  }

  const summary = summarizeOutdatedDeviceNames(outdatedDevices, formatDeviceName)
  const verb = outdatedDevices.length > 1 ? 'are' : 'is'

  return (
    <Alert className='sticky top-4 z-20 border-brand-200 bg-brand-50/95 text-brand-950 shadow-sm backdrop-blur dark:border-brand-800 dark:bg-brand-950/90 dark:text-brand-50'>
      <BellRing className='h-4 w-4 text-brand-600 dark:text-brand-300' />
      <AlertDescription className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='pr-2 text-sm'>
          <span className='font-medium'>{summary}</span> {verb} running an older app
          version. Update to version {latestAppVersionCode} for improved
          reliability, bug fixes, and more.
        </div>
        <Button asChild size='sm' className='w-full md:w-auto shrink-0'>
          <Link href={Routes.downloadAndroidApp}>
            Update app
            <ArrowUpRight className='ml-1 h-4 w-4' />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

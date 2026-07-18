'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/shared/empty-state'
import { useDeviceMessages, useDevices } from '@/lib/api'
import { formatDeviceName } from '@/lib/utils'
import { getStatusBadge } from './message-history/utils'
import type { SmsMessage } from './message-history/types'
import { cn } from '@/lib/utils'

const RECENT_LIMIT = 5

// Messages are only exposed per device (/gateway/devices/:id/messages, there
// is no cross-device endpoint), so this shows the first enabled device and
// says which one, rather than implying it covers the whole account.
export default function RecentActivity() {
  const { data: devices, isPending: devicesPending } = useDevices()
  const device = devices?.find((d) => d.enabled) ?? devices?.[0]

  const { data: messagesResponse, isPending: messagesPending } =
    useDeviceMessages(
      device?._id ?? '',
      { limit: RECENT_LIMIT },
      { enabled: Boolean(device?._id) }
    )

  const messages = (messagesResponse?.data ?? []) as SmsMessage[]
  const isLoading = devicesPending || (Boolean(device) && messagesPending)

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <div className='min-w-0'>
          <CardTitle className='text-base'>Recent activity</CardTitle>
          {device && (
            <p className='mt-0.5 truncate text-xs text-muted-foreground'>
              {formatDeviceName(device)}
            </p>
          )}
        </div>
        <Link
          href='/dashboard/messaging/history'
          className='inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline'
        >
          View all
          <ArrowRight className='h-3.5 w-3.5' />
        </Link>
      </CardHeader>

      <CardContent className='pt-0'>
        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='flex-1 space-y-1.5'>
                  <Skeleton className='h-3.5 w-32' />
                  <Skeleton className='h-3 w-full max-w-56' />
                </div>
              </div>
            ))}
          </div>
        ) : !device ? (
          <EmptyState
            icon={MessageSquare}
            title='No device connected yet'
            hint='Register a device to start sending and receiving messages'
          />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title='No messages yet'
            hint='Messages you send or receive will show up here'
          />
        ) : (
          <ul className='divide-y divide-border'>
            {messages.slice(0, RECENT_LIMIT).map((message) => {
              const badge = getStatusBadge(message.status)
              const target =
                message.recipient ?? message.recipients?.[0] ?? message.sender

              return (
                <li
                  key={message._id}
                  className='flex items-start gap-3 py-2.5 first:pt-0 last:pb-0'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>
                      {target ?? 'Unknown recipient'}
                    </p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {message.message}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      badge.color
                    )}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

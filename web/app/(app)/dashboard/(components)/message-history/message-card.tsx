'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import { formatTimestamp, getStatusBadge } from './utils'
import type { Device } from '@/lib/api'
import type { SmsMessage } from './types'

type MessageCardProps = {
  message: SmsMessage
  type: 'sent' | 'received'
  device?: Device
  onSelectMessage: (message: SmsMessage) => void
}

export function MessageCard({
  message,
  type,
  device,
  onSelectMessage,
}: MessageCardProps) {
  const isSent = type === 'sent'

  const formattedDate = formatTimestamp(
    (isSent ? message.requestedAt : message.receivedAt) || message.createdAt
  )
  const statusBadge = getStatusBadge(message.status)

  // Only devices on app version >= 14 report per-message status, and only
  // messages created after the rollout date have reliable values.
  const shouldShowStatus =
    (device?.appVersionCode ?? 0) >= 14 &&
    new Date(message?.createdAt) > new Date('2025-06-05')

  // No entrance animation here: this list refetches on filter change,
  // pagination and auto-refresh, so an animated row replays its fade on every
  // tick.
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
                <div className='flex items-center text-primary font-medium'>
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
            <p className='text-sm max-w-sm md:max-w-none line-clamp-2'>
              {message.message}
            </p>
          </div>

          <div className='flex justify-between items-center'>
            {isSent && shouldShowStatus && (
              <Badge
                variant='outline'
                className={`${statusBadge.color} flex items-center text-xs`}
              >
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

export function MessageCardSkeleton() {
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

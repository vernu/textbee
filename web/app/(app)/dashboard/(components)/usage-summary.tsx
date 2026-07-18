'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock, Infinity as InfinityIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscription } from '@/lib/api'
import { deriveUsage, type UsageWindow } from '@/lib/usage'
import { cn } from '@/lib/utils'

// The question a dashboard should answer first is "how much of my quota is
// left", which the all-time counters could never answer. Every value here
// comes from the subscription response; nothing is estimated.
function UsageCard({
  title,
  window: usageWindow,
  icon: Icon,
  isLoading,
}: {
  title: string
  window: UsageWindow
  icon: typeof Clock
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className='space-y-3 p-5'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-32' />
          <Skeleton className='h-1.5 w-full' />
        </CardContent>
      </Card>
    )
  }

  const { used, limit, remaining, percentage, unlimited, nearLimit, atLimit } =
    usageWindow

  return (
    <Card>
      <CardContent className='space-y-3 p-5'>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <Icon className='h-4 w-4 text-muted-foreground' />
        </div>

        {unlimited ? (
          <>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold'>
                {used.toLocaleString()}
              </span>
              <span className='text-sm text-muted-foreground'>sent</span>
            </div>
            <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <InfinityIcon className='h-3.5 w-3.5' />
              Unlimited on your plan
            </p>
          </>
        ) : (
          <>
            <div className='flex items-baseline gap-1.5'>
              <span className='text-2xl font-bold'>
                {used.toLocaleString()}
              </span>
              <span className='text-sm text-muted-foreground'>
                / {limit?.toLocaleString() ?? '-'}
              </span>
            </div>

            <div
              className='h-1.5 w-full overflow-hidden rounded-full bg-muted'
              role='progressbar'
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${title} usage`}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-300',
                  atLimit
                    ? 'bg-destructive'
                    : nearLimit
                      ? 'bg-amber-500'
                      : 'bg-primary'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className='flex items-center justify-between gap-2'>
              <p
                className={cn(
                  'text-xs',
                  atLimit
                    ? 'font-medium text-destructive'
                    : nearLimit
                      ? 'font-medium text-amber-600 dark:text-amber-500'
                      : 'text-muted-foreground'
                )}
              >
                {atLimit
                  ? 'Limit reached'
                  : `${remaining.toLocaleString()} remaining`}
              </p>
              {(nearLimit || atLimit) && (
                <Link
                  href='/dashboard/account/billing'
                  className='inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline'
                >
                  Upgrade
                  <ArrowRight className='h-3 w-3' />
                </Link>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function UsageSummary() {
  const { data: subscription, isPending } = useSubscription()
  const { daily, monthly } = deriveUsage(subscription)

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <UsageCard
        title='Today'
        window={daily}
        icon={Clock}
        isLoading={isPending}
      />
      <UsageCard
        title='This month'
        window={monthly}
        icon={CalendarDays}
        isLoading={isPending}
      />
    </div>
  )
}

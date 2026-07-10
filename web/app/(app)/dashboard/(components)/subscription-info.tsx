'use client'

import { useEffect } from 'react'
import { Calendar, Check, Info, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useCurrentUser, useSubscription } from '@/lib/api'
import {
  formatLimit,
  formatPrice,
  formatDate,
  getBillingInterval,
  titleCaseStatus,
} from '@/lib/format'
import { subscriptionStatusTone, usageMeterColor } from '@/lib/status'
import { polarCustomerPortalRequestUrl } from '@/config/external-links'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type Meter = {
  used: number
  remaining: number
  percentage: number
  usedLabel: string
  unlimited: boolean
}

type LimitTileProps = {
  label: string
  effectiveValue: number | null | undefined
  planValue: number | null | undefined
  isOverridden: boolean
  planName?: string
  tooltipUnit: string
  unlimitedNote?: string
  meter?: Meter
}

function LimitTile({
  label,
  effectiveValue,
  planValue,
  isOverridden,
  planName,
  tooltipUnit,
  unlimitedNote,
  meter,
}: LimitTileProps) {
  const isUnlimited = effectiveValue === -1
  const meterColor = meter ? usageMeterColor(meter.percentage) : 'bg-green-500'

  return (
    <div
      className={cn(
        'p-2 rounded-md',
        isOverridden
          ? 'bg-amber-500/5 ring-1 ring-amber-500/30'
          : 'bg-muted'
      )}
    >
      <div className='flex items-center justify-between gap-1'>
        <p className='text-xs text-muted-foreground'>{label}</p>
        {isOverridden && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 cursor-default'>
                  <Sparkles className='h-2.5 w-2.5' />
                  Custom
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className='max-w-[220px]'>
                  Custom limit set for your account by the textbee team.
                  {planName
                    ? ` Standard ${planName} plan limit: ${formatLimit(
                        planValue
                      )} ${tooltipUnit}.`
                    : ''}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className='mt-0.5 flex items-baseline gap-1.5'>
        <p className='text-sm font-semibold text-foreground'>
          {formatLimit(effectiveValue)}
        </p>
        {isOverridden && (
          <span className='text-xs text-muted-foreground line-through'>
            {formatLimit(planValue)}
          </span>
        )}
        {isUnlimited && unlimitedNote && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='inline-flex items-center'>
                  <Info className='h-3.5 w-3.5 text-muted-foreground cursor-pointer' />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{unlimitedNote}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {meter && !meter.unlimited && (
        <div className='mt-1.5'>
          <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className={cn('h-full rounded-full transition-all', meterColor)}
              style={{ width: `${Math.min(Math.max(meter.percentage, 0), 100)}%` }}
            />
          </div>
          <div className='mt-1 flex items-center justify-between text-[10px] text-muted-foreground'>
            <span>
              {meter.used.toLocaleString()} {meter.usedLabel}
            </span>
            <span>{Math.max(meter.remaining, 0).toLocaleString()} left</span>
          </div>
        </div>
      )}
      {meter && meter.unlimited && (
        <p className='mt-1.5 text-[10px] text-muted-foreground'>
          {meter.used.toLocaleString()} {meter.usedLabel}
        </p>
      )}
    </div>
  )
}

export default function SubscriptionInfo() {
  const { toast } = useToast()

  // the checkout page redirects here after an in-place plan change
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('plan-change-success')) {
      toast({
        title: 'Plan updated',
        description: 'Your subscription has been updated to the new plan.',
      })
      searchParams.delete('plan-change-success')
      const query = searchParams.toString()
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`,
      )
    }
  }, [toast])
  const {
    data: currentSubscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
  } = useSubscription()

  const { data: currentUser } = useCurrentUser()

  if (isLoadingSubscription)
    return (
      <div className='flex justify-center items-center h-full min-h-[200px]'>
        <Spinner size='sm' />
      </div>
    )

  if (subscriptionError)
    return (
      <p className='text-sm text-destructive'>
        Failed to load subscription information
      </p>
    )

  const plan = currentSubscription?.plan
  const usage = currentSubscription?.usage
  const planName = plan?.name || 'Free'

  const isOverridden = (
    custom: number | null | undefined,
    planValue: number | null | undefined
  ) => custom != null && custom !== planValue

  const limitTiles: LimitTileProps[] = [
    {
      label: 'Daily',
      effectiveValue: usage?.dailyLimit ?? plan?.dailyLimit,
      planValue: plan?.dailyLimit,
      isOverridden: isOverridden(
        currentSubscription?.customDailyLimit,
        plan?.dailyLimit
      ),
      planName,
      tooltipUnit: 'per day',
      unlimitedNote: 'Unlimited (within monthly limit)',
      meter: {
        used: usage?.processedSmsToday ?? 0,
        remaining: usage?.dailyRemaining ?? 0,
        percentage: usage?.dailyUsagePercentage ?? 0,
        usedLabel: 'used today',
        unlimited: (usage?.dailyLimit ?? plan?.dailyLimit) === -1,
      },
    },
    {
      label: 'Monthly',
      effectiveValue: usage?.monthlyLimit ?? plan?.monthlyLimit,
      planValue: plan?.monthlyLimit,
      isOverridden: isOverridden(
        currentSubscription?.customMonthlyLimit,
        plan?.monthlyLimit
      ),
      planName,
      tooltipUnit: 'per month',
      unlimitedNote: 'Unlimited (within fair usage)',
      meter: {
        used: usage?.processedSmsLastMonth ?? 0,
        remaining: usage?.monthlyRemaining ?? 0,
        percentage: usage?.monthlyUsagePercentage ?? 0,
        usedLabel: 'used this month',
        unlimited: (usage?.monthlyLimit ?? plan?.monthlyLimit) === -1,
      },
    },
    {
      label: 'Bulk send',
      effectiveValue: usage?.bulkSendLimit ?? plan?.bulkSendLimit,
      planValue: plan?.bulkSendLimit,
      isOverridden: isOverridden(
        currentSubscription?.customBulkSendLimit,
        plan?.bulkSendLimit
      ),
      planName,
      tooltipUnit: 'per bulk send',
      unlimitedNote: 'Unlimited (within monthly limit)',
    },
    {
      label: 'Devices',
      effectiveValue: usage?.deviceLimit ?? plan?.deviceLimit,
      planValue: plan?.deviceLimit,
      isOverridden: isOverridden(
        currentSubscription?.customDeviceLimit,
        plan?.deviceLimit
      ),
      planName,
      tooltipUnit: 'devices',
      unlimitedNote: 'Unlimited devices',
    },
  ]

  const hasCustomLimits = limitTiles.some((tile) => tile.isOverridden)

  return (
    <div className='bg-card border rounded-lg shadow p-4'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='text-lg font-bold text-foreground'>
              {plan?.name || 'Free Plan'}
            </h3>
            {hasCustomLimits && (
              <Badge
                variant='outline'
                className='gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium'
              >
                <Sparkles className='h-3 w-3' />
                Custom limits
              </Badge>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <p className='text-xs text-muted-foreground'>
              Current subscription
            </p>
            {currentSubscription?.amount > 0 && (
              <Badge variant='outline' className='text-xs font-medium'>
                {formatPrice(
                  currentSubscription?.amount,
                  currentSubscription?.currency
                )}
                {currentSubscription?.recurringInterval && (
                  <span className='ml-1'>
                    /{' '}
                    {getBillingInterval(currentSubscription?.recurringInterval)}
                  </span>
                )}
              </Badge>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex items-center px-2 py-0.5 rounded-full',
            subscriptionStatusTone(currentSubscription?.status).bg
          )}
        >
          <Check
            className={cn(
              'h-3 w-3 mr-1',
              subscriptionStatusTone(currentSubscription?.status).text
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              subscriptionStatusTone(currentSubscription?.status).text
            )}
          >
            {titleCaseStatus(currentSubscription?.status) || 'Active'}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2.5 mb-4'>
        <div className='flex items-center space-x-2 bg-card p-2.5 rounded-md shadow-sm'>
          <Calendar className='h-3.5 w-3.5 text-primary flex-none' />
          <div>
            <p className='text-[11px] text-muted-foreground'>
              Start Date
            </p>
            <p className='text-xs font-medium text-foreground'>
              {formatDate(currentSubscription?.subscriptionStartDate)}
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2 bg-card p-2.5 rounded-md shadow-sm'>
          <Calendar className='h-3.5 w-3.5 text-primary flex-none' />
          <div>
            <p className='text-[11px] text-muted-foreground'>
              Next Payment
            </p>
            <p className='text-xs font-medium text-foreground'>
              {formatDate(currentSubscription?.currentPeriodEnd)}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-card p-3 rounded-md shadow-sm mb-4'>
        <div className='flex items-center justify-between mb-2.5'>
          <div className='flex items-center gap-1'>
            <p className='text-xs text-muted-foreground font-medium'>
              Usage Limits
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='inline-flex items-center'>
                    <Info className='h-3.5 w-3.5 text-muted-foreground cursor-pointer' />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='max-w-[240px]'>
                    SMS usage is measured on a rolling window, not your billing
                    cycle. Daily usage resets at 00:00 UTC and monthly usage
                    covers a rolling 30-day window. The Start Date and Next
                    Payment above are just your subscription start and renewal
                    dates.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {hasCustomLimits && (
            <p className='text-[10px] text-amber-600 dark:text-amber-400'>
              Custom values set for your account
            </p>
          )}
        </div>
        <div className='grid grid-cols-2 gap-2.5'>
          {limitTiles.map((tile) => (
            <LimitTile key={tile.label} {...tile} />
          ))}
        </div>
      </div>

      <div className='flex justify-end gap-2 flex-wrap'>
        {(!currentSubscription?.plan?.name ||
          currentSubscription?.plan?.name?.toLowerCase() === 'free') ? (
          <Link
            href='/checkout/pro'
            className='text-xs font-medium text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors'
          >
            Upgrade to Pro →
          </Link>
        ) : currentSubscription?.plan?.name?.toLowerCase() === 'pro' ? (
          <>
            <Link
              href='/checkout/scale'
              className='text-xs font-medium text-white bg-brand-700 hover:bg-brand-800 px-3 py-1.5 rounded-md transition-colors'
            >
              Upgrade to Scale →
            </Link>
            <Link
              href={polarCustomerPortalRequestUrl(currentUser?.email)}
              className='text-xs font-medium text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors'
            >
              Manage Subscription →
            </Link>
          </>
        ) : (
          <Link
            href={polarCustomerPortalRequestUrl(currentUser?.email)}
            className='text-xs font-medium text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors'
          >
            Manage Subscription →
          </Link>
        )}
      </div>
    </div>
  )
}

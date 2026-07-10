'use client'

import { useEffect } from 'react'
import { Calendar, Check, Info, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useQuery } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
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

const formatLimit = (value: number | null | undefined) => {
  if (value === -1) return 'Unlimited'
  if (value == null) return '0'
  return value.toLocaleString()
}

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
  const meterColor =
    meter && meter.percentage >= 100
      ? 'bg-red-500'
      : meter && meter.percentage >= 80
      ? 'bg-amber-500'
      : 'bg-green-500'

  return (
    <div
      className={cn(
        'p-2 rounded-md',
        isOverridden
          ? 'bg-amber-500/5 ring-1 ring-amber-500/30'
          : 'bg-gray-50 dark:bg-gray-700/50'
      )}
    >
      <div className='flex items-center justify-between gap-1'>
        <p className='text-xs text-gray-500 dark:text-gray-400'>{label}</p>
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
        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
          {formatLimit(effectiveValue)}
        </p>
        {isOverridden && (
          <span className='text-xs text-gray-400 dark:text-gray-500 line-through'>
            {formatLimit(planValue)}
          </span>
        )}
        {isUnlimited && unlimitedNote && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='inline-flex items-center'>
                  <Info className='h-3.5 w-3.5 text-gray-400 cursor-pointer' />
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
          <div className='h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
            <div
              className={cn('h-full rounded-full transition-all', meterColor)}
              style={{ width: `${Math.min(Math.max(meter.percentage, 0), 100)}%` }}
            />
          </div>
          <div className='mt-1 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400'>
            <span>
              {meter.used.toLocaleString()} {meter.usedLabel}
            </span>
            <span>{Math.max(meter.remaining, 0).toLocaleString()} left</span>
          </div>
        </div>
      )}
      {meter && meter.unlimited && (
        <p className='mt-1.5 text-[10px] text-gray-500 dark:text-gray-400'>
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
  } = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.billing.currentSubscription())
        .then((res) => res.data),
  })

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.whoAmI())
        .then((res) => res.data?.data),
  })

  // Format price with currency symbol
  const formatPrice = (
    amount: number | null | undefined,
    currency: string | null | undefined
  ) => {
    if (amount == null || currency == null) return 'Free'

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD',
      minimumFractionDigits: 2,
    })

    return formatter.format(amount / 100)
  }

  const getBillingInterval = (interval: string | null | undefined) => {
    if (!interval) return ''
    return interval.toLowerCase() === 'month' ? 'monthly' : 'yearly'
  }

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
    <div className='bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border rounded-lg shadow p-4'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
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
            <p className='text-xs text-gray-500 dark:text-gray-400'>
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
          className={`flex items-center px-2 py-0.5 rounded-full ${
            currentSubscription?.status === 'active'
              ? 'bg-green-50 dark:bg-green-900/30'
              : currentSubscription?.status === 'past_due'
              ? 'bg-amber-50 dark:bg-amber-900/30'
              : 'bg-gray-50 dark:bg-gray-800/50'
          }`}
        >
          <Check
            className={`h-3 w-3 mr-1 ${
              currentSubscription?.status === 'active'
                ? 'text-green-600 dark:text-green-400'
                : currentSubscription?.status === 'past_due'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          />
          <span
            className={`text-xs font-medium ${
              currentSubscription?.status === 'active'
                ? 'text-green-600 dark:text-green-400'
                : currentSubscription?.status === 'past_due'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {currentSubscription?.status
              ? currentSubscription.status
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
              : 'Active'}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2.5 mb-4'>
        <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 p-2.5 rounded-md shadow-sm'>
          <Calendar className='h-3.5 w-3.5 text-brand-600 dark:text-brand-400 flex-none' />
          <div>
            <p className='text-[11px] text-gray-500 dark:text-gray-400'>
              Start Date
            </p>
            <p className='text-xs font-medium text-gray-900 dark:text-white'>
              {currentSubscription?.subscriptionStartDate
                ? new Date(
                    currentSubscription?.subscriptionStartDate
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 p-2.5 rounded-md shadow-sm'>
          <Calendar className='h-3.5 w-3.5 text-brand-600 dark:text-brand-400 flex-none' />
          <div>
            <p className='text-[11px] text-gray-500 dark:text-gray-400'>
              Next Payment
            </p>
            <p className='text-xs font-medium text-gray-900 dark:text-white'>
              {currentSubscription?.currentPeriodEnd
                ? new Date(
                    currentSubscription?.currentPeriodEnd
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm mb-4'>
        <div className='flex items-center justify-between mb-2.5'>
          <div className='flex items-center gap-1'>
            <p className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
              Usage Limits
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='inline-flex items-center'>
                    <Info className='h-3.5 w-3.5 text-gray-400 cursor-pointer' />
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
            className='text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-md transition-colors'
          >
            Upgrade to Pro →
          </Link>
        ) : currentSubscription?.plan?.name?.toLowerCase() === 'pro' ? (
          <>
            <Link
              href='/checkout/scale'
              className='text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-md transition-colors'
            >
              Upgrade to Scale →
            </Link>
            <Link
              href={polarCustomerPortalRequestUrl(currentUser?.email)}
              className='text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-md transition-colors'
            >
              Manage Subscription →
            </Link>
          </>
        ) : (
          <Link
            href={polarCustomerPortalRequestUrl(currentUser?.email)}
            className='text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-md transition-colors'
          >
            Manage Subscription →
          </Link>
        )}
      </div>
    </div>
  )
}

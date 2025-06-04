'use client'

import { Calendar, Check, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useQuery } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function SubscriptionInfo() {
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

  return (
    <div className='bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border rounded-lg shadow p-5'>
      <div className='flex items-center justify-between mb-5'>
        <div>
          <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
            {currentSubscription?.plan?.name || 'Free Plan'}
          </h3>
          <div className='flex items-center gap-2'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
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

      <div className='grid grid-cols-2 gap-3 mb-5'>
        <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm'>
          <Calendar className='h-4 w-4 text-brand-600 dark:text-brand-400' />
          <div>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Start Date
            </p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {currentSubscription?.subscriptionStartDate
                ? new Date(
                    currentSubscription?.subscriptionStartDate
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2 bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm'>
          <Calendar className='h-4 w-4 text-brand-600 dark:text-brand-400' />
          <div>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Next Payment
            </p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {currentSubscription?.currentPeriodEnd
                ? new Date(
                    currentSubscription?.currentPeriodEnd
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm mb-5'>
        <p className='text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium'>
          Usage Limits
        </p>
        <div className='grid grid-cols-3 gap-3'>
          <div className='bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>Daily</p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {currentSubscription?.plan?.dailyLimit === -1
                ? 'Unlimited'
                : currentSubscription?.plan?.dailyLimit || '0'}
              {currentSubscription?.plan?.dailyLimit === -1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className='inline-flex items-center'>
                        <Info className='h-4 w-4 text-gray-500 ml-1 cursor-pointer' />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unlimited (within monthly limit)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </p>
          </div>
          <div className='bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>Monthly</p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {currentSubscription?.plan?.monthlyLimit === -1
                ? 'Unlimited'
                : currentSubscription?.plan?.monthlyLimit?.toLocaleString() ||
                  '0'}
              {currentSubscription?.plan?.monthlyLimit === -1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className='inline-flex items-center'>
                        <Info className='h-4 w-4 text-gray-500 ml-1 cursor-pointer' />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unlimited (within fair usage)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </p>
          </div>
          <div className='bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>Bulk</p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {currentSubscription?.plan?.bulkSendLimit === -1
                ? 'Unlimited'
                : currentSubscription?.plan?.bulkSendLimit || '0'}
              {currentSubscription?.plan?.bulkSendLimit === -1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className='inline-flex items-center'>
                        <Info className='h-4 w-4 text-gray-500 ml-1 cursor-pointer' />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unlimited (within monthly limit)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className='flex justify-end'>
        {!currentSubscription?.plan?.name ||
        currentSubscription?.plan?.name?.toLowerCase() === 'free' ? (
          <Link
            href='/checkout/pro'
            className='text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-md transition-colors'
          >
            Upgrade to Pro →
          </Link>
        ) : (
          <Link
            href='https://polar.sh/textbee/portal/'
            className='text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-md transition-colors'
          >
            Manage Subscription →
          </Link>
        )}
      </div>
    </div>
  )
}

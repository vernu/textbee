'use client'

import { useState, useEffect, useCallback, use } from 'react'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { apiErrorMessage } from '@/lib/utils/errorHandler'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  findPlanTier,
  formatPlanPrice,
  monthlyEquivalent,
  yearlySavingPercent,
} from '@/lib/plans'
import { cn } from '@/lib/utils'

type BillingInterval = 'monthly' | 'yearly'

interface PlanChangePreview {
  currentPlan: string
  currentInterval: string
  newPlan: string
  newInterval: string
  isUpgrade: boolean
  cancelAtPeriodEnd: boolean
}

const formatPlan = (plan: string, interval: string) =>
  `${plan.charAt(0).toUpperCase() + plan.slice(1)} (${interval})`

/** Frames every state on this page so they share one width and one elevation. */
function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-[80vh] items-center justify-center p-6'>
      <div className='w-full max-w-md rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm'>
        {children}
      </div>
    </div>
  )
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ planName: string }>
}) {
  const [error, setError] = useState<string | null>(null)
  const [planChange, setPlanChange] = useState<PlanChangePreview | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSlow, setIsSlow] = useState(false)

  // params is a promise in Next 16, reading it synchronously yields undefined
  const { planName } = use(params)
  const tier = findPlanTier(planName)

  const { status } = useSession()
  const router = useRouter()

  const [selected, setSelected] = useState<BillingInterval>('yearly')

  // marketing and pricing pages link here with ?billingInterval=monthly|yearly
  // (legacy ?billing= fallback until the marketing site redeploys)
  const searchParams = useSearchParams()
  const rawInterval =
    searchParams.get('billingInterval') ?? searchParams.get('billing')
  const urlInterval: BillingInterval | null =
    rawInterval === 'yearly'
      ? 'yearly'
      : rawInterval === 'monthly'
        ? 'monthly'
        : null

  const initiateCheckout = useCallback(
    async (billingInterval: BillingInterval) => {
      setIsSubmitting(true)
      setIsSlow(false)
      setError(null)
      try {
        const response = await httpBrowserClient.post(
          ApiEndpoints.billing.checkout(),
          { planName, billingInterval },
        )

        if (response.data?.redirectUrl) {
          window.location.href = response.data?.redirectUrl
        } else if (response.data?.planChange) {
          // user already has a paid subscription: confirm before updating it
          setPlanChange(response.data.planChange)
          setIsSubmitting(false)
        } else {
          throw new Error('No redirect URL found')
        }
      } catch (error) {
        // a 400 is not transient, so surface it rather than retrying blindly
        const serverMessage = apiErrorMessage(error)
        setError(
          serverMessage ||
            'Failed to create checkout session. Please try again or contact billing@textbee.dev.',
        )
        console.error(serverMessage)
        setIsSubmitting(false)
      }
    },
    [planName],
  )

  const confirmPlanChange = async () => {
    setIsConfirming(true)
    try {
      await httpBrowserClient.post(ApiEndpoints.billing.changePlan(), {
        planName,
        billingInterval: urlInterval ?? selected,
      })
      // Straight to the billing tab: the /dashboard/account redirect stub
      // drops query params, which silently ate the success toast.
      window.location.href = '/dashboard/account/billing?plan-change-success=1'
    } catch (error) {
      // no auto-retry here: the request may have charged the card
      setPlanChange(null)
      const serverMessage = apiErrorMessage(error)
      setError(
        serverMessage ||
          'Failed to change your plan. Please try again or contact billing@textbee.dev.',
      )
      console.error(serverMessage)
      setIsConfirming(false)
    }
  }

  // an interval in the URL means the choice was already made on the pricing
  // page, so do not ask again
  useEffect(() => {
    if (urlInterval === 'monthly' || urlInterval === 'yearly') {
      initiateCheckout(urlInterval)
    }
  }, [urlInterval, initiateCheckout])

  useEffect(() => {
    if (!isSubmitting) return
    const timer = setTimeout(() => setIsSlow(true), 5000)
    return () => clearTimeout(timer)
  }, [isSubmitting])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.href)}`)
    }
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <CheckoutShell>
        <div className='flex flex-col items-center gap-4 text-center'>
          <Spinner size='lg' className='motion-reduce:animate-none' />
          <p className='text-sm text-muted-foreground'>Loading</p>
        </div>
      </CheckoutShell>
    )
  }

  if (error) {
    return (
      <CheckoutShell>
        <div className='flex flex-col gap-4'>
          <div>
            <h1 className='text-lg font-semibold'>We could not start checkout</h1>
            <p className='mt-2 text-sm text-destructive'>{error}</p>
          </div>
          <div className='flex flex-col gap-2'>
            <Button onClick={() => initiateCheckout(urlInterval ?? selected)}>
              Try again
            </Button>
            <Button variant='ghost' asChild>
              <Link href='/dashboard/account/billing'>Back to your account</Link>
            </Button>
          </div>
        </div>
      </CheckoutShell>
    )
  }

  if (planChange) {
    return (
      <CheckoutShell>
        <h1 className='text-lg font-semibold'>Confirm your plan change</h1>

        <div className='my-6 flex items-center justify-center gap-3 text-sm font-medium'>
          <span>
            {formatPlan(planChange.currentPlan, planChange.currentInterval)}
          </span>
          <ArrowRight className='h-4 w-4 text-primary' aria-hidden />
          <span>{formatPlan(planChange.newPlan, planChange.newInterval)}</span>
        </div>

        <p className='text-sm text-muted-foreground'>
          The change takes effect immediately. The price difference for the
          remainder of your billing period is prorated by our payment provider
          {planChange.isUpgrade
            ? ' and may be charged to your payment method right away.'
            : ' and credited towards your upcoming invoices.'}
        </p>

        {planChange.cancelAtPeriodEnd && (
          <p className='mt-3 text-sm text-amber-600 dark:text-amber-500'>
            Your subscription is currently scheduled to cancel at the end of the
            billing period. Changing your plan will remove the scheduled
            cancellation.
          </p>
        )}

        <div className='mt-6 flex gap-3'>
          <Button
            onClick={confirmPlanChange}
            disabled={isConfirming}
            className='flex-1'
          >
            {isConfirming && (
              <Spinner
                size='sm'
                color='white'
                className='mr-2 motion-reduce:animate-none'
              />
            )}
            {isConfirming ? 'Updating' : 'Confirm change'}
          </Button>
          <Button
            variant='outline'
            className='flex-1'
            disabled={isConfirming}
            asChild
          >
            <Link href='/dashboard/account/billing'>Cancel</Link>
          </Button>
        </div>
      </CheckoutShell>
    )
  }

  // an interval in the URL always redirects, so show progress rather than
  // flashing the chooser before the effect fires
  if (isSubmitting || urlInterval !== null) {
    const intervalLabel = (urlInterval ?? selected) === 'yearly' ? 'yearly' : 'monthly'
    const price =
      tier &&
      ((urlInterval ?? selected) === 'yearly'
        ? tier.yearlyPrice
        : tier.monthlyPrice)

    return (
      <CheckoutShell>
        <div className='flex flex-col items-center gap-4 text-center'>
          <Spinner size='lg' className='motion-reduce:animate-none' />

          <div>
            <h1 className='text-lg font-semibold'>
              {tier
                ? `Setting up your ${tier.name} ${intervalLabel} checkout`
                : 'Setting up your checkout'}
            </h1>
            <p className='mt-2 text-sm text-muted-foreground'>
              Redirecting you to Polar, our payment provider. This only takes a
              moment.
            </p>
          </div>

          {tier && price !== undefined && (
            <p className='text-sm font-medium tabular-nums'>
              {tier.name}, {intervalLabel}, {formatPlanPrice(price)}
            </p>
          )}

          {isSlow && (
            <p className='text-sm text-muted-foreground'>
              Still working, hang on.
            </p>
          )}
        </div>
      </CheckoutShell>
    )
  }

  // no interval in the URL: ask rather than guess, with yearly preselected
  const perMonth = tier ? monthlyEquivalent(tier) : undefined
  const saving = tier ? yearlySavingPercent(tier) : undefined

  return (
    <CheckoutShell>
      <h1 className='text-lg font-semibold'>
        {tier ? `Upgrade to ${tier.name}` : 'Choose your billing'}
      </h1>
      <p className='mt-1 text-sm text-muted-foreground'>
        Pick how you would like to be billed.
      </p>

      <fieldset className='mt-6'>
        <legend className='sr-only'>Billing interval</legend>
        <div className='flex flex-col gap-3'>
          {tier?.yearlyPrice !== undefined && (
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                selected === 'yearly'
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              <input
                type='radio'
                name='billingInterval'
                value='yearly'
                checked={selected === 'yearly'}
                onChange={() => setSelected('yearly')}
                className='mt-1 accent-primary'
              />
              <span className='flex-1'>
                <span className='flex items-center justify-between gap-2'>
                  <span className='font-medium'>Yearly</span>
                  {saving !== undefined && (
                    <Badge variant='secondary'>Save {saving}%</Badge>
                  )}
                </span>
                <span className='mt-1 block text-sm text-muted-foreground tabular-nums'>
                  {perMonth !== undefined &&
                    `${formatPlanPrice(perMonth)}/month, billed yearly at ${formatPlanPrice(tier.yearlyPrice)}`}
                </span>
              </span>
            </label>
          )}

          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
              selected === 'monthly'
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:bg-muted/50',
            )}
          >
            <input
              type='radio'
              name='billingInterval'
              value='monthly'
              checked={selected === 'monthly'}
              onChange={() => setSelected('monthly')}
              className='mt-1 accent-primary'
            />
            <span className='flex-1'>
              <span className='font-medium'>Monthly</span>
              <span className='mt-1 block text-sm text-muted-foreground tabular-nums'>
                {tier && `${formatPlanPrice(tier.monthlyPrice)}/month`}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <Button
        className='mt-6 w-full'
        onClick={() => initiateCheckout(selected)}
      >
        Continue to checkout
      </Button>

      <p className='mt-3 text-center text-xs text-muted-foreground'>
        Cancel anytime, keep access until the end of your billing period.
      </p>
    </CheckoutShell>
  )
}

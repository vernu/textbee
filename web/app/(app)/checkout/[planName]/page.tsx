'use client'

import { useState, useEffect, useCallback } from 'react'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Loader, CheckCircle, ArrowRight } from 'lucide-react'

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

export default function CheckoutPage({ params }) {
  const [error, setError] = useState<string | null>(null)
  const [planChange, setPlanChange] = useState<PlanChangePreview | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const planName = params.planName as string

  const { data: session } = useSession()

  const getBillingInterval = () => {
    // marketing site and pricing pages link here with ?billingInterval=monthly|yearly
    // (legacy ?billing= fallback until the marketing site redeploys)
    const searchParams = new URLSearchParams(window.location.search)
    const billingInterval =
      searchParams.get('billingInterval') ?? searchParams.get('billing')
    return billingInterval === 'yearly' ? 'yearly' : 'monthly'
  }

  const initiateCheckout = useCallback(
    async (retries = 2) => {
      try {
        const response = await httpBrowserClient.post(
          ApiEndpoints.billing.checkout(),
          {
            planName,
            billingInterval: getBillingInterval(),
          },
        )

        if (response.data?.redirectUrl) {
          window.location.href = response.data?.redirectUrl
        } else if (response.data?.planChange) {
          // user already has a paid subscription: confirm before updating it
          setPlanChange(response.data.planChange)
        } else {
          throw new Error('No redirect URL found')
        }
      } catch (error) {
        if (retries > 0) {
          initiateCheckout(retries - 1)
        } else {
          setError(error.response?.data?.message || 'Failed to create checkout session. Please try again or contact billing@textbee.dev.')
          console.error(error.response?.data?.message)
        }
      }
    },
    [planName]
  )

  const confirmPlanChange = async () => {
    setIsConfirming(true)
    try {
      await httpBrowserClient.post(ApiEndpoints.billing.changePlan(), {
        planName,
        billingInterval: getBillingInterval(),
      })
      window.location.href = '/dashboard/account?plan-change-success=1'
    } catch (error) {
      // no auto-retry here: the request may have charged the card
      setPlanChange(null)
      setError(
        error.response?.data?.message ||
          'Failed to change your plan. Please try again or contact billing@textbee.dev.',
      )
      console.error(error.response?.data?.message)
      setIsConfirming(false)
    }
  }

  useEffect(() => {
    initiateCheckout()
  }, [initiateCheckout])

  if (!session?.user) {
    return redirect(`/login?redirect=${window.location.href}`)
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <div className='text-red-500'>{error}</div>
        <button
          onClick={() => {
            setError(null)
            initiateCheckout()
          }}
          className='mt-4 px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600'
        >
          Try Again
        </button>
      </div>
    )
  }

  if (planChange) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[80vh] p-6'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            Confirm your plan change
          </h2>
          <div className='flex items-center justify-center gap-3 mb-6 text-lg font-semibold text-gray-700'>
            <span>
              {formatPlan(planChange.currentPlan, planChange.currentInterval)}
            </span>
            <ArrowRight className='text-brand-500' size={20} />
            <span>{formatPlan(planChange.newPlan, planChange.newInterval)}</span>
          </div>
          <p className='text-gray-600 mb-2'>
            The change takes effect immediately. The price difference for the
            remainder of your billing period is prorated by our payment
            provider
            {planChange.isUpgrade
              ? ' and may be charged to your payment method right away.'
              : ' and credited towards your upcoming invoices.'}
          </p>
          {planChange.cancelAtPeriodEnd && (
            <p className='text-amber-600 mb-2'>
              Your subscription is currently scheduled to cancel at the end of
              the billing period. Changing your plan will remove the scheduled
              cancellation.
            </p>
          )}
          <div className='flex gap-3 mt-6'>
            <button
              onClick={confirmPlanChange}
              disabled={isConfirming}
              className='flex-1 px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-2'
            >
              {isConfirming && <Loader className='animate-spin' size={16} />}
              {isConfirming ? 'Updating...' : 'Confirm change'}
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard/account')}
              disabled={isConfirming}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-60'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-[80vh] bg-gray-100 p-6 rounded-lg shadow-lg'>
      <Loader className='animate-spin mb-4 text-brand-500' size={48} />
      <h2 className='text-2xl font-bold text-gray-800 mb-2'>Hang Tight!</h2>
      <p className='text-lg text-gray-600 mb-4'>
        We're processing your order. This won't take long!
      </p>
      <CheckCircle className='text-green-500 mb-2' size={32} />
      <span className='text-lg font-semibold'>
        Thank you for your patience!
      </span>
    </div>
  )
}

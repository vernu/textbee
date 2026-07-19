'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { polarCustomerPortalRequestUrl } from '@/config/external-links'
import { useCurrentUser, useSubscription } from '@/lib/api'
import { CreditCard, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function PastDueBillingAlert() {
  const { data: currentSubscription, isLoading: subLoading } = useSubscription()
  const { data: currentUser, isLoading: userLoading } = useCurrentUser()

  if (subLoading || userLoading || !currentSubscription || !currentUser) {
    return null
  }

  const status = currentSubscription.status as string | undefined
  const planName = (currentSubscription.plan as { name?: string } | undefined)
    ?.name
  const isPaid =
    planName &&
    planName.toLowerCase() !== 'free' &&
    (currentSubscription.amount ?? 0) > 0

  if (status !== 'past_due' || !isPaid) {
    return null
  }

  const portalUrl = polarCustomerPortalRequestUrl(currentUser.email)

  return (
    <Alert className='border-amber-500/80 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50 dark:border-amber-600'>
      <AlertDescription className='flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-4'>
        <span className='w-full sm:flex-1 text-center sm:text-left text-sm md:text-base font-medium flex items-center justify-center sm:justify-start gap-2'>
          <AlertTriangle className='h-5 w-5 shrink-0' />
          Your subscription payment failed and your account is past due. Update
          your payment method to avoid losing access.
        </span>
        <div className='w-full sm:w-auto mt-2 sm:mt-0 flex justify-center sm:justify-end'>
          <Button
            variant='default'
            size='sm'
            asChild
            className='bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500'
          >
            <Link href={portalUrl} target='_blank' rel='noopener noreferrer'>
              <CreditCard className='mr-2 h-4 w-4' />
              Update payment
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useMemo } from 'react'

export default function UpgradeToProAlert() {
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

  const monthlyUsagePercentage = currentSubscription?.usage?.monthlyUsagePercentage || 0
  const monthlyLimit = currentSubscription?.usage?.monthlyLimit || 0
  const processedSmsLastMonth = currentSubscription?.usage?.processedSmsLastMonth || 0

  const alertConfig = useMemo(() => {
    if (monthlyUsagePercentage >= 100 ) {
      return {
        bgColor: 'bg-gradient-to-r from-red-600 to-red-800',
        message: "⚠️ Monthly limit exceeded! Your requests will be rejected until you upgrade.",
        subMessage: `You've used ${processedSmsLastMonth} of ${monthlyLimit} SMS this month.`,
        buttonText: "Upgrade Now!",
        buttonColor: 'bg-white text-red-600 hover:bg-red-50 hover:text-red-700 border-red-600',
        urgency: 'critical'
      }
    } else if (monthlyUsagePercentage >= 80) {
      return {
        bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
        message: "⚠️ Approaching limit! Upgrade to Pro to avoid service interruption.",
        subMessage: `You've used ${monthlyUsagePercentage}% of your monthly SMS limit (${processedSmsLastMonth}/${monthlyLimit}).`,
        buttonText: "Upgrade Before Limit!",
        buttonColor: 'bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-600',
        urgency: 'warning'
      }
    } else {
      const ctaMessages = [
        "Upgrade to Pro for exclusive features and benefits!",
        "Offer: You are eligible for a 30% discount when upgrading to Pro!",
        "Unlock premium features with our Pro plan today!",
        "Take your experience to the next level with Pro!",
        "Pro users get priority support and advanced features!",
        "Limited time offer: Upgrade to Pro and save 30%!",
      ]
      const buttonTexts = [
        "Get Pro Now!",
        "Upgrade Today!",
        "Go Pro!",
        "Unlock Pro!",
        "Claim Your Discount!",
        "Upgrade & Save!",
      ]
      const randomIndex = Math.floor(Math.random() * ctaMessages.length)
      
      return {
        bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
        message: ctaMessages[randomIndex],
        subMessage: `Use discount code SAVE30P at checkout for a 30% discount!`,
        buttonText: buttonTexts[randomIndex],
        buttonColor: 'bg-red-500 text-white hover:bg-red-600 border-red-500',
        urgency: 'normal'
      }
    }
  }, [monthlyUsagePercentage, monthlyLimit, processedSmsLastMonth])

  if (isLoadingSubscription || !currentSubscription || subscriptionError) {
    return null
  }

  if (currentSubscription?.plan?.name !== 'free') {
    return null
  }

  return (
    <Alert className={`${alertConfig.bgColor} text-white`}>
      <AlertDescription className='flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-4'>
        <span className='w-full sm:flex-1 text-center sm:text-left text-sm md:text-base font-medium'>
          {alertConfig.message}
        </span>
        <span className='w-full sm:flex-1 text-center sm:text-left text-xs md:text-sm'>
          {alertConfig.urgency === 'normal' ? (
            <>Use discount code <strong className="text-yellow-200">SAVE30P</strong> at checkout for a 30% discount!</>
          ) : (
            alertConfig.subMessage
          )}
        </span>
        <div className='w-full sm:w-auto mt-2 sm:mt-0 flex justify-center sm:justify-end flex-wrap gap-1 md:gap-2'>
          <Button
            variant='outline'
            size='sm'
            asChild
            className={`${alertConfig.buttonColor} text-xs md:text-sm`}
          >
            <Link href={'/checkout/pro'}>{alertConfig.buttonText}</Link>
          </Button>
          {alertConfig.urgency === 'normal' && (
            <Button
              variant='outline'
              size='sm'
              asChild
              className='bg-orange-500 text-white hover:bg-orange-600 text-xs md:text-sm'
            >
              <Link href={'/#pricing'}>Learn More</Link>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

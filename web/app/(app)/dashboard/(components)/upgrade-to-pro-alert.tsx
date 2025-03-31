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

  const ctaMessages = useMemo(() => [
    "Upgrade to Pro for exclusive features and benefits!",
    "Offer: You are eligible for a 30% discount when upgrading to Pro!",
    "Unlock premium features with our Pro plan today!",
    "Take your experience to the next level with Pro!",
    "Pro users get priority support and advanced features!",
    "Limited time offer: Upgrade to Pro and save 30%!",
  ], []);

  const buttonTexts = useMemo(() => [
    "Get Pro Now!",
    "Upgrade Today!",
    "Go Pro!",
    "Unlock Pro!",
    "Claim Your Discount!",
    "Upgrade & Save!",
  ], []);

  const randomCta = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * ctaMessages.length);
    return ctaMessages[randomIndex];
  }, [ctaMessages]);

  const randomButtonText = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * buttonTexts.length);
    return buttonTexts[randomIndex];
  }, [buttonTexts]);

  if (isLoadingSubscription || !currentSubscription || subscriptionError) {
    return null
  }

  if (currentSubscription?.plan?.name !== 'free') {
    return null
  }

  return (
    <Alert className='bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
      <AlertDescription className='flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-4'>
        <span className='w-full sm:flex-1 text-center sm:text-left text-sm md:text-base font-medium'>
          {randomCta}
        </span>
        <span className='w-full sm:flex-1 text-center sm:text-left text-xs md:text-sm'>
          Use discount code <strong className="text-yellow-200">SAVE30P</strong> at checkout for a 30%
          discount!
        </span>
        <div className='w-full sm:w-auto mt-2 sm:mt-0 flex justify-center sm:justify-end flex-wrap gap-1 md:gap-2'>
          <Button
            variant='outline'
            size='sm'
            asChild
            className='bg-red-500 text-white hover:bg-red-600 text-xs md:text-sm'
          >
            <Link href={'/checkout/pro'}>{randomButtonText}</Link>
          </Button>
          <Button
            variant='outline'
            size='sm'
            asChild
            className='bg-orange-500 text-white hover:bg-orange-600 text-xs md:text-sm'
          >
            <Link href={'/#pricing'}>Learn More</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

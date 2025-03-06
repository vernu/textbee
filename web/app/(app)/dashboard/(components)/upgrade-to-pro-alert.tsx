import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

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

  if (isLoadingSubscription || !currentSubscription || subscriptionError) {
    return null
  }

  if (['pro', 'custom'].includes(currentSubscription?.plan?.name)) {
    return null
  }

  return (
    <Alert className='bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
      <AlertDescription className='flex flex-wrap items-center gap-2 md:gap-4'>
        <span className='flex-1'>
          Upgrade to Pro for exclusive features and benefits!
        </span>
        <span className='flex-1'>
          Use discount code <strong>SAVEBIG50</strong> at checkout for a 50%
          discount!
        </span>
        <div className='flex flex-wrap gap-1 md:gap-2'>
          <Button
            variant='outline'
            size='lg'
            asChild
            className='bg-red-500 text-white hover:bg-red-600'
          >
            <Link href={'/checkout/pro'}>Get Pro Now!</Link>
          </Button>
          <Button
            variant='outline'
            size='lg'
            asChild
            className='bg-orange-500 text-white hover:bg-orange-600'
          >
            <Link href={'/#pricing'}>Learn More</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

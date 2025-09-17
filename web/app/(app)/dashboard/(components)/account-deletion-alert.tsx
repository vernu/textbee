import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

export default function AccountDeletionAlert() {
  const [isDismissed, setIsDismissed] = useState(false)

  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: userDataError,
  } = useQuery({
    queryKey: ['whoAmI'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.whoAmI())
        .then((res) => res.data.data),
  })

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  if (isLoadingUserData || !userData || userDataError || isDismissed) {
    return null
  }

  // Only show the alert if the user has requested account deletion
  if (!userData.accountDeletionRequestedAt) {
    return null
  }

  // Calculate days remaining until deletion (assuming 7-day window)
  const deletionDate = new Date(userData.accountDeletionRequestedAt)
  deletionDate.setDate(deletionDate.getDate() + 7)
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (deletionDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    )
  )

  return (
    <Alert className='bg-gradient-to-r from-amber-600 to-red-600 text-white relative'>
      <button
        onClick={handleDismiss}
        className='absolute left-2 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-colors'
        aria-label='Dismiss alert'
      >
        <X className='h-4 w-4' />
      </button>
      <AlertDescription className='flex items-center gap-2 pl-4'>
        <AlertTriangle className='h-5 w-5 flex-shrink-0' />
        <div className='text-sm md:text-base'>
          <span className='font-medium'>Your account is pending deletion.</span>{' '}
          Your data will be permanently deleted{' '}
          {daysRemaining > 0
            ? `in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
            : 'very soon.'}{' '}
          If you would like to cancel this request, please email{' '}
          <span className='font-medium'>support@textbee.dev</span>.
        </div>
      </AlertDescription>
    </Alert>
  )
}

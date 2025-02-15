'use client'

import { useState, useEffect } from 'react'
import httpBrowserClient from '@/lib/httpBrowserClient'

export default function CheckoutPage({ params }) {
  const [error, setError] = useState<string | null>(null)

  const planName = params.planName as string

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        const response = await httpBrowserClient.post('/billing/checkout', {
          planName,
        })

        window.location.href = response.data?.redirectUrl
      } catch (error) {
        setError('Failed to create checkout session. Please try again.')
        console.error(error)
      }
    }

    initiateCheckout()
  }, [planName])

  if (error) {
    return <div className='text-red-500'>{error}</div>
  }

  return (
    <div className='flex justify-center items-center min-h-[50vh]'>
      processing...
    </div>
  )
}

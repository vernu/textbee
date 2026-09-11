'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { isEnabled } from '@/lib/analytics/config'

// Labels the Clarity session with the signed-in email so a support request can
// be matched to a recording. Lives inside the session provider, unlike
// <Analytics />, which is mounted at the root layout to cover signed-out pages.
// Nothing is sent to Google Analytics here: its terms forbid personal data.
export default function AnalyticsIdentify() {
  const { data: session } = useSession()
  const email = session?.user?.email ?? ''

  useEffect(() => {
    if (!email || !isEnabled('clarity')) return
    window.clarity?.('set', 'userId', email)
  }, [email])

  return null
}

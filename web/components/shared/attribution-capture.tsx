'use client'

import { useEffect } from 'react'
import { captureTouch } from '@/lib/analytics/attribution'

// Records first-touch and last-touch acquisition source in a first-party
// cookie. No network request, so it runs regardless of analytics providers.
export default function AttributionCapture() {
  useEffect(() => {
    captureTouch()
  }, [])

  return null
}

'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Footer from './footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only show footer on dashboard pages (including account pages which are under /dashboard/account)
  const shouldShowFooter = mounted && pathname?.startsWith('/dashboard')

  if (!shouldShowFooter) {
    return null
  }

  return <Footer />
}
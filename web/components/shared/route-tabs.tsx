'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export type RouteTab = {
  href: string
  label: string
  // Exact-match only (used for index routes like /dashboard/messaging so they
  // don't stay active on sibling subroutes).
  exact?: boolean
}

function isTabActive(tab: RouteTab, pathname: string): boolean {
  if (tab.exact) return pathname === tab.href
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`)
}

// Link-based segmented control: tabs are real routes, so the active tab
// survives refresh and deep links are shareable. Mobile: horizontally
// scrollable pills; the active pill scrolls into view on load. Links opt into
// full prefetch because these routes are dynamic (session cookie in the app
// layout), which the router's default prefetch skips.
export default function RouteTabs({
  tabs,
  className,
}: {
  tabs: RouteTab[]
  className?: string
}) {
  const pathname = usePathname()
  const activeRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    // Deep links must land with the selected pill visible on small screens.
    activeRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    })
  }, [pathname])

  return (
    <nav
      className={cn(
        'flex gap-1 overflow-x-auto rounded-lg bg-muted p-1',
        'scrollbar-none w-full sm:w-fit',
        className
      )}
      aria-label='Section navigation'
    >
      {tabs.map((tab) => {
        const active = isTabActive(tab, pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            ref={active ? activeRef : undefined}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

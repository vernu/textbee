import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RouteTabs from './route-tabs'

// Capture Link props: prefetch is router behavior, invisible in the DOM.
vi.mock('next/link', () => ({
  default: ({ children, href, prefetch, ...rest }: any) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/messaging',
}))

const tabs = [
  { href: '/dashboard/messaging', label: 'Send', exact: true },
  { href: '/dashboard/messaging/bulk', label: 'Bulk Send' },
  { href: '/dashboard/messaging/history', label: 'History' },
]

describe('RouteTabs', () => {
  it('opts every tab link into full prefetch', () => {
    render(<RouteTabs tabs={tabs} />)
    // These routes are dynamic (session cookie in the app layout); without an
    // explicit prefetch every tab click pays a full server round trip.
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('data-prefetch', 'true')
    }
    expect(screen.getAllByRole('link')).toHaveLength(tabs.length)
  })

  it('marks only the active tab with aria-current', () => {
    render(<RouteTabs tabs={tabs} />)
    expect(screen.getByRole('link', { name: 'Send' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(
      screen.getByRole('link', { name: 'Bulk Send' })
    ).not.toHaveAttribute('aria-current')
  })
})

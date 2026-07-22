import { describe, expect, it } from 'vitest'
import { isNavItemActive, navItems } from './nav-items'

describe('isNavItemActive', () => {
  it('matches the dashboard home exactly', () => {
    expect(isNavItemActive({ href: '/dashboard' }, '/dashboard')).toBe(true)
    expect(isNavItemActive({ href: '/dashboard' }, '/dashboard/messaging')).toBe(
      false
    )
  })

  it('matches section subroutes by prefix', () => {
    const messaging = { href: '/dashboard/messaging' }
    expect(isNavItemActive(messaging, '/dashboard/messaging')).toBe(true)
    expect(isNavItemActive(messaging, '/dashboard/messaging/bulk')).toBe(true)
    expect(isNavItemActive(messaging, '/dashboard/messaging/api-guide')).toBe(
      true
    )
  })

  it('does not match sibling routes that share a name prefix', () => {
    expect(
      isNavItemActive({ href: '/dashboard/message' }, '/dashboard/messaging')
    ).toBe(false)
  })

  it('keeps Account active across the section while linking to billing', () => {
    const account = navItems.find((item) => item.label === 'Account')
    // Direct link skips the /dashboard/account redirect stub.
    expect(account?.href).toBe('/dashboard/account/billing')
    expect(isNavItemActive(account!, '/dashboard/account/billing')).toBe(true)
    expect(isNavItemActive(account!, '/dashboard/account/profile')).toBe(true)
    expect(isNavItemActive(account!, '/dashboard/account/security')).toBe(true)
    expect(isNavItemActive(account!, '/dashboard/account')).toBe(true)
    expect(isNavItemActive(account!, '/dashboard/community')).toBe(false)
  })
})

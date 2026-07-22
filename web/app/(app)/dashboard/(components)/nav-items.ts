import {
  LayoutDashboard,
  MessageSquareText,
  Webhook,
  Users,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  // Active-state prefix when it differs from href (Account links straight to
  // billing so the click skips the /dashboard/account redirect stub, but must
  // stay highlighted on every account tab).
  match?: string
  // The mobile tab bar caps at 4 items (375px width); items marked
  // mobileHidden appear only in the desktop sidebar and the command palette.
  mobileHidden?: boolean
}

// Primary dashboard navigation, shared by the desktop sidebar, the mobile tab
// bar, and the command palette so they never drift out of sync.
export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/messaging', label: 'Messaging', icon: MessageSquareText },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook, mobileHidden: true },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  {
    href: '/dashboard/account/billing',
    label: 'Account',
    icon: UserCircle,
    match: '/dashboard/account',
  },
]

export const mobileNavItems = navItems.filter((item) => !item.mobileHidden)

// /dashboard must match exactly; deeper routes match by prefix so nested pages
// keep their parent highlighted.
export function isNavItemActive(
  item: Pick<NavItem, 'href' | 'match'>,
  pathname: string
): boolean {
  const prefix = item.match ?? item.href
  return prefix === '/dashboard'
    ? pathname === prefix
    : pathname === prefix || pathname.startsWith(`${prefix}/`)
}

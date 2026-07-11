import {
  Home,
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
  // The mobile tab bar caps at 4 items (375px width); items marked
  // mobileHidden appear only in the desktop sidebar and the command palette.
  mobileHidden?: boolean
}

// Primary dashboard navigation, shared by the desktop sidebar, the mobile tab
// bar, and the command palette so they never drift out of sync.
export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/messaging', label: 'Messaging', icon: MessageSquareText },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook, mobileHidden: true },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  { href: '/dashboard/account', label: 'Account', icon: UserCircle },
]

export const mobileNavItems = navItems.filter((item) => !item.mobileHidden)

// /dashboard must match exactly; deeper routes match by prefix so nested pages
// keep their parent highlighted.
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === '/dashboard'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(href)
}

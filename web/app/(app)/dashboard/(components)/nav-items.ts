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
}

// Primary dashboard navigation, shared by the desktop sidebar, the mobile tab
// bar, and the command palette so they never drift out of sync.
export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/messaging', label: 'Messaging', icon: MessageSquareText },
  { href: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  { href: '/dashboard/account', label: 'Account', icon: UserCircle },
]

// /dashboard must match exactly; deeper routes match by prefix so nested pages
// keep their parent highlighted.
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === '/dashboard'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(href)
}

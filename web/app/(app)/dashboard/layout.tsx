'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AccountDeletionAlert from './(components)/account-deletion-alert'
import UpgradeToProAlert from './(components)/upgrade-to-pro-alert'
import UpdateAppModal from './(components)/update-app-modal'
import UpdateAppNotificationBar from './(components)/update-app-notification-bar'
import VerifyEmailAlert from './(components)/verify-email-alert'
import PastDueBillingAlert from './(components)/past-due-billing-alert'
import { SurveyModal } from '@/components/shared/survey-modal'
import CommandMenu from './(components)/command-menu'
import {
  isNavItemActive,
  mobileNavItems,
  navItems,
  type NavItem,
} from './(components)/nav-items'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className='min-h-[calc(100vh-3.5rem)]'>
      {/* Desktop sidebar, sits below the sticky app header (h-14). */}
      <aside className='fixed inset-y-0 left-0 top-14 z-30 hidden w-60 flex-col border-r border-border bg-card md:flex'>
        <div className='flex-1 overflow-y-auto px-3 py-4'>
          <div className='mb-4'>
            <CommandMenu />
          </div>
          <nav className='flex flex-col gap-1'>
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={isNavItemActive(item.href, pathname)}
              />
            ))}
          </nav>
        </div>
        <div className='border-t border-border px-4 py-3'>
          <p className='text-xs text-muted-foreground'>
            Need help?{' '}
            <a
              href='https://textbee.dev/quickstart'
              target='_blank'
              rel='noreferrer'
              className='font-medium text-primary hover:underline'
            >
              Quick start
            </a>
          </p>
        </div>
      </aside>

      {/* Main content, offset for the fixed sidebar on desktop. */}
      <div className='md:pl-60'>
        <div className='space-y-2 p-4 pb-0'>
          <UpdateAppNotificationBar />
          <VerifyEmailAlert />
          <PastDueBillingAlert />
          <AccountDeletionAlert />
          <UpgradeToProAlert />
        </div>
        <main className='pb-20 md:pb-8'>{children}</main>
      </div>

      {/* Mobile bottom tab bar (max 4 items; the rest are desktop/palette only). */}
      <nav className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden'>
        <div className='flex h-16 items-center justify-around'>
          {mobileNavItems.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              isActive={isNavItemActive(item.href, pathname)}
            />
          ))}
        </div>
      </nav>

      <SurveyModal />
      <UpdateAppModal />
    </div>
  )
}

function SidebarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      prefetch
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className='h-[18px] w-[18px] shrink-0 stroke-[1.75]' />
      <span>{item.label}</span>
    </Link>
  )
}

function MobileNavLink({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      prefetch
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className='h-5 w-5 stroke-[1.75]' />
      <span>{item.label}</span>
    </Link>
  )
}

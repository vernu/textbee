'use client'

import { Home, MessageSquareText, UserCircle, Users, ContactRound, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AccountDeletionAlert from './(components)/account-deletion-alert'
import UpgradeToProAlert from './(components)/upgrade-to-pro-alert'
import VerifyEmailAlert from './(components)/verify-email-alert'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Pages that need height-constrained layout (no scrolling)
  const constrainedPages = ['/dashboard/contacts', '/dashboard/campaigns', '/dashboard/inbox']
  const isConstrainedPage = constrainedPages.some(page => pathname.startsWith(page))

  if (isConstrainedPage) {
    return (
      <div className='flex h-screen flex-col'>
        {/* Main content - Height constrained */}
        <main className='flex-1 min-w-0 overflow-hidden flex flex-col pt-14'>
          <div className='space-y-2 px-4 [&:not(:empty)]:pt-4 [&:not(:empty)]:pb-2 flex-shrink-0'>
            <VerifyEmailAlert />
            <AccountDeletionAlert />
            <UpgradeToProAlert />
          </div>
          <div className='flex-1 overflow-hidden'>
            {children}
          </div>
        </main>

        {/* Bottom navigation for mobile */}
        <nav className='sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10'>
          <div className='flex items-center justify-around h-16'>
            <MobileNavItem
              href='/dashboard'
              icon={<Home className='h-4 w-4 stroke-[1.5]' />}
              label='Dashboard'
              isActive={pathname === '/dashboard'}
            />
            <MobileNavItem
              href='/dashboard/messaging'
              icon={<MessageSquareText className='h-4 w-4 stroke-[1.5]' />}
              label='Messaging'
              isActive={pathname === '/dashboard/messaging'}
            />
            <MobileNavItem
              href='/dashboard/campaigns'
              icon={<Megaphone className='h-4 w-4 stroke-[1.5]' />}
              label='Campaigns'
              isActive={pathname === '/dashboard/campaigns'}
            />
            <MobileNavItem
              href='/dashboard/contacts'
              icon={<ContactRound className='h-4 w-4 stroke-[1.5]' />}
              label='Contacts'
              isActive={pathname === '/dashboard/contacts'}
            />
            <MobileNavItem
              href='/dashboard/community'
              icon={<Users className='h-4 w-4 stroke-[1.5]' />}
              label='Community'
              isActive={pathname === '/dashboard/community'}
            />
            <MobileNavItem
              href='/dashboard/account'
              icon={<UserCircle className='h-4 w-4 stroke-[1.5]' />}
              label='Account'
              isActive={pathname === '/dashboard/account'}
            />
          </div>
        </nav>

        {/* Bottom padding for mobile to account for the fixed navigation */}
        <div className='h-16 sm:hidden'></div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen flex-col'>
      {/* Main content - Scrollable */}
      <main className='flex-1 min-w-0 pt-14'>
        <div className='space-y-2 px-4 [&:not(:empty)]:pt-4 [&:not(:empty)]:pb-2'>
          <VerifyEmailAlert />
          <AccountDeletionAlert />
          <UpgradeToProAlert />
        </div>
        {children}
      </main>

      {/* Bottom navigation for mobile */}
      <nav className='sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10'>
        <div className='flex items-center justify-around h-16'>
          <MobileNavItem
            href='/dashboard'
            icon={<Home className='h-4 w-4 stroke-[1.5]' />}
            label='Dashboard'
            isActive={pathname === '/dashboard'}
          />
          <MobileNavItem
            href='/dashboard/messaging'
            icon={<MessageSquareText className='h-4 w-4 stroke-[1.5]' />}
            label='Messaging'
            isActive={pathname === '/dashboard/messaging'}
          />
          <MobileNavItem
            href='/dashboard/campaigns'
            icon={<Megaphone className='h-4 w-4 stroke-[1.5]' />}
            label='Campaigns'
            isActive={pathname === '/dashboard/campaigns'}
          />
          <MobileNavItem
            href='/dashboard/contacts'
            icon={<ContactRound className='h-4 w-4 stroke-[1.5]' />}
            label='Contacts'
            isActive={pathname === '/dashboard/contacts'}
          />
          <MobileNavItem
            href='/dashboard/community'
            icon={<Users className='h-4 w-4 stroke-[1.5]' />}
            label='Community'
            isActive={pathname === '/dashboard/community'}
          />
          <MobileNavItem
            href='/dashboard/account'
            icon={<UserCircle className='h-4 w-4 stroke-[1.5]' />}
            label='Account'
            isActive={pathname === '/dashboard/account'}
          />
        </div>
      </nav>

      {/* Bottom padding for mobile to account for the fixed navigation */}
      <div className='h-16 sm:hidden'></div>
    </div>
  )
}

// Mobile navigation item
function MobileNavItem({
  href,
  icon,
  label,
  isActive,
}: {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={`flex flex-col items-center justify-center p-2 rounded-md w-[15%] ${
        isActive
          ? 'border border-brand-500 dark:border-brand-400 bg-brand-100/20 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400'
          : 'text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400'
      }`}
    >
      <span
        className={
          isActive
            ? 'text-brand-600 dark:text-brand-400'
            : 'text-gray-600 dark:text-gray-300'
        }
      >
        {icon}
      </span>
      <span className='text-xs mt-1'>{label}</span>
    </Link>
  )
}

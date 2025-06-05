'use client'

import { Home, MessageSquareText, UserCircle, Users } from 'lucide-react'
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

  return (
    <div className='flex min-h-screen flex-col md:flex-row'>
      {/* Sidebar for desktop */}
      <aside className='hidden md:flex flex-col fixed top-[20%] left-0 w-24 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-10 rounded-r-lg'>
        <nav className='flex flex-col justify-center items-center h-full py-3 space-y-4'>
          <NavItem
            href='/dashboard'
            icon={<Home className='h-6 w-6 stroke-[1.5]' />}
            label='Dashboard'
            isActive={pathname === '/dashboard'}
          />
          <NavItem
            href='/dashboard/messaging'
            icon={<MessageSquareText className='h-6 w-6 stroke-[1.5]' />}
            label='Messaging'
            isActive={pathname === '/dashboard/messaging'}
          />
          <NavItem
            href='/dashboard/community'
            icon={<Users className='h-6 w-6 stroke-[1.5]' />}
            label='Community'
            isActive={pathname === '/dashboard/community'}
          />
          <NavItem
            href='/dashboard/account'
            icon={<UserCircle className='h-6 w-6 stroke-[1.5]' />}
            label='Account'
            isActive={pathname === '/dashboard/account'}
          />
        </nav>
      </aside>

      {/* Main content with left padding to account for fixed sidebar */}
      <main className='flex-1 min-w-0 overflow-auto md:ml-24'>
        <div className='space-y-2 p-4'>
          <VerifyEmailAlert />
          <AccountDeletionAlert />
          <UpgradeToProAlert />
        </div>
        {children}
      </main>

      {/* Bottom navigation for mobile */}
      <nav className='md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10'>
        <div className='flex items-center justify-around h-16'>
          <MobileNavItem
            href='/dashboard'
            icon={<Home className='h-5 w-5 stroke-[1.5]' />}
            label='Dashboard'
            isActive={pathname === '/dashboard'}
          />
          <MobileNavItem
            href='/dashboard/messaging'
            icon={<MessageSquareText className='h-5 w-5 stroke-[1.5]' />}
            label='Messaging'
            isActive={pathname === '/dashboard/messaging'}
          />
          <MobileNavItem
            href='/dashboard/community'
            icon={<Users className='h-5 w-5 stroke-[1.5]' />}
            label='Community'
            isActive={pathname === '/dashboard/community'}
          />
          <MobileNavItem
            href='/dashboard/account'
            icon={<UserCircle className='h-5 w-5 stroke-[1.5]' />}
            label='Account'
            isActive={pathname === '/dashboard/account'}
          />
        </div>
      </nav>

      {/* Bottom padding for mobile to account for the fixed navigation */}
      <div className='h-16 md:hidden'></div>
    </div>
  )
}

// Desktop navigation item
function NavItem({
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
      className={`flex flex-col items-center p-2 rounded-md transition-colors w-20 ${
        isActive
          ? 'border border-brand-500 dark:border-brand-400 bg-brand-100/20 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400'
          : 'text-gray-700 dark:text-gray-200 hover:bg-brand-100/20 dark:hover:bg-brand-900/10 hover:text-brand-600 dark:hover:text-brand-400'
      }`}
    >
      <span
        className={
          isActive
            ? 'text-brand-600 dark:text-brand-400 mb-1'
            : 'text-gray-600 dark:text-gray-300 mb-1'
        }
      >
        {icon}
      </span>
      <span className='font-medium text-xs'>{label}</span>
    </Link>
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
      className={`flex flex-col items-center justify-center p-2 rounded-md w-[23%] ${
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

import type { PropsWithChildren } from 'react'
import { UserIcon } from 'lucide-react'
import RouteTabs from '@/components/shared/route-tabs'

// Account is one settings experience: sections are route-based tabs (same
// interaction grammar as messaging/webhooks), Billing first since the
// subscription is the most-visited account content.
export default function AccountLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex-1 p-4 sm:p-6 md:p-8'>
      <div className='mb-4 space-y-1'>
        <div className='flex items-center space-x-2'>
          <UserIcon className='h-6 w-6 text-primary' />
          <h2 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            Account
          </h2>
        </div>
        <p className='text-muted-foreground'>
          Manage your subscription, profile and security
        </p>
      </div>

      <RouteTabs
        className='mb-6'
        tabs={[
          { href: '/dashboard/account/billing', label: 'Billing & plan' },
          { href: '/dashboard/account/profile', label: 'Profile' },
          { href: '/dashboard/account/security', label: 'Security' },
          { href: '/dashboard/account/support', label: 'Support' },
        ]}
      />

      {children}
    </div>
  )
}

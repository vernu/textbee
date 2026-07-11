import type { PropsWithChildren } from 'react'
import { MessageSquareTextIcon } from 'lucide-react'
import RouteTabs from '@/components/shared/route-tabs'

// Messaging section shell: shared header + route-based tabs, so the active
// tab survives refresh and every view has a shareable URL.
export default function MessagingLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex-1 p-4 sm:p-6 md:p-8'>
      <div className='mb-4 space-y-1'>
        <div className='flex items-center space-x-2'>
          <MessageSquareTextIcon className='h-6 w-6 text-primary' />
          <h2 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            Messaging
          </h2>
        </div>
        <p className='text-muted-foreground'>
          Send messages and view your SMS history
        </p>
      </div>

      <RouteTabs
        className='mb-6'
        tabs={[
          { href: '/dashboard/messaging', label: 'Send', exact: true },
          { href: '/dashboard/messaging/bulk', label: 'Bulk Send' },
          { href: '/dashboard/messaging/history', label: 'History' },
          { href: '/dashboard/messaging/api-guide', label: 'API' },
        ]}
      />

      {children}
    </div>
  )
}

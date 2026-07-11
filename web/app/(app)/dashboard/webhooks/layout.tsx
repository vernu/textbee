import type { PropsWithChildren } from 'react'
import { Webhook } from 'lucide-react'
import RouteTabs from '@/components/shared/route-tabs'

// Webhooks section shell: subscriptions management and delivery history are
// route-based tabs, so the active view survives refresh.
export default function WebhooksLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex-1 p-4 sm:p-6 md:p-8'>
      <div className='mb-4 space-y-1'>
        <div className='flex items-center space-x-2'>
          <Webhook className='h-6 w-6 text-primary' />
          <h2 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            Webhooks
          </h2>
        </div>
        <p className='text-muted-foreground'>
          Get notified at your endpoints when SMS events happen
        </p>
      </div>

      <RouteTabs
        className='mb-6'
        tabs={[
          { href: '/dashboard/webhooks', label: 'Webhooks', exact: true },
          { href: '/dashboard/webhooks/deliveries', label: 'Deliveries' },
        ]}
      />

      {children}
    </div>
  )
}

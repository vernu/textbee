import type { PropsWithChildren } from 'react'
import { Webhook } from 'lucide-react'
import RouteTabs from '@/components/shared/route-tabs'
import PageHeader from '@/components/shared/page-header'

// Webhooks section shell: subscriptions management and delivery history are
// route-based tabs, so the active view survives refresh.
export default function WebhooksLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex-1 p-4 sm:p-6 md:p-8'>
      <PageHeader
        icon={Webhook}
        title='Webhooks'
        description='Get notified at your endpoints when SMS events happen'
      />

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

import type { PropsWithChildren } from 'react'
import { MessageSquareTextIcon } from 'lucide-react'
import RouteTabs from '@/components/shared/route-tabs'
import PageHeader from '@/components/shared/page-header'

// Messaging section shell: shared header + route-based tabs, so the active
// tab survives refresh and every view has a shareable URL.
//
// The content column is defined once here rather than per page. Each subroute
// used to set its own width (Send xl, Bulk 3xl, API 4xl, History none), so the
// layout jumped every time you changed tab, and the header and tabs ran wider
// than the content beneath them.
export default function MessagingLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex-1 p-4 sm:p-6 md:p-8'>
      <div className='w-full max-w-3xl'>
        <PageHeader
          icon={MessageSquareTextIcon}
          title='Messaging'
          description='Send messages and view your SMS history'
        />

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
    </div>
  )
}

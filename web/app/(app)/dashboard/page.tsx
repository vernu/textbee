'use client'

import DeviceList from './(components)/device-list'
import WebhooksSection from './(components)/webhooks/webhooks-section'
import Overview from './(components)/overview'
import ApiKeys from './(components)/api-keys'
import { useSession } from 'next-auth/react'
import { HomeIcon, ArrowUpRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className='flex-1 space-y-6 p-6 md:p-8'>
      <div className='space-y-1'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <HomeIcon className='h-6 w-6 text-primary' />
            <h2 className='text-3xl font-bold tracking-tight'>Dashboard</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open('https://textbee.dev/quickstart', '_blank')}>
            <ArrowUpRightIcon className="mr-2 h-4 w-4" />
            Quick Start
          </Button>
        </div>
        <p className='text-muted-foreground'>
          Welcome back, {session?.user?.name || 'User'}
        </p>
      </div>

      <div className='space-y-6'>
        <Overview />

        <div className='grid gap-6 md:grid-cols-2'>
          <DeviceList />
          <ApiKeys />
        </div>

        <WebhooksSection />
      </div>
    </div>
  )
}

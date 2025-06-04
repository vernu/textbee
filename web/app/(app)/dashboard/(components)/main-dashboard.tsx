'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import Overview from './overview'
import DeviceList from './device-list'
import ApiKeys from './api-keys'
import Messaging from './messaging'
import WebhooksSection from './webhooks/webhooks-section'

export default function DashboardOverview() {

  const [currentTab, setCurrentTab] = useState('overview')

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
  }

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className='space-y-4'
    >
      <TabsList className='sticky top-[4rem] z-10 flex mx-auto max-w-md border-[1px] my-6 bg-brand-500 text-white '>
        <TabsTrigger value='overview' className='flex-1'>
          Overview
        </TabsTrigger>
        <TabsTrigger value='messaging' className='relative flex-1'>
          <MessageSquare className='ml-2 h-4 w-4' />
          <span className='mx-2'>Messaging</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value='overview' className='space-y-4'>
        <Overview />

        <div className='grid gap-4 md:grid-cols-2'>
          <DeviceList />
          <ApiKeys />
        </div>

        <WebhooksSection />
      </TabsContent>

      <TabsContent value='messaging'>
        <Messaging />
      </TabsContent>
    </Tabs>
  )
}

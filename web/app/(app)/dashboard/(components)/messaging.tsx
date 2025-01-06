'use client'

import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SendSms from './send-sms'
import ReceivedSms from './received-sms'
import BulkSMSSend from './bulk-sms-send'
import { Badge } from '@/components/ui/badge'

export default function Messaging() {
  const [currentTab, setCurrentTab] = useState('send')

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
  }

  return (
    <div className='grid gap-6 max-w-sm md:max-w-xl mx-auto mt-10'>
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className='space-y-4'
      >
        <TabsList className='flex'>
          <TabsTrigger value='send' className='flex-1'>
            Send
          </TabsTrigger>
          <TabsTrigger value='bulk-send' className='flex-1'>
            Bulk Send{' '}
            <Badge
              variant='outline'
              className='ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            >
              new
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='received' className='flex-1'>
            Received
          </TabsTrigger>
        </TabsList>

        <TabsContent value='send' className='space-y-4'>
          <SendSms />
        </TabsContent>

        <TabsContent value='bulk-send' className='space-y-4'>
          {/* comming soon section */}
          <div className='grid gap-6 max-w-xl mx-auto mt-10'>
            <BulkSMSSend />
          </div>
        </TabsContent>

        <TabsContent value='received' className='space-y-4'>
          <ReceivedSms />
        </TabsContent>
      </Tabs>
    </div>
  )
}

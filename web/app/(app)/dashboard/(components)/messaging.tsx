'use client'

import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SendSms from './send-sms'
import MessageHistory from './message-history'
import BulkSMSSend from './bulk-sms-send'

export default function Messaging() {
  const [currentTab, setCurrentTab] = useState('send')

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
  }

  return (
    <div className='grid gap-6 w-full max-w-sm md:max-w-3xl'>
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
          </TabsTrigger>
          <TabsTrigger value='history' className='flex-1'>
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value='send' className='space-y-4'>
          <SendSms />
        </TabsContent>

        <TabsContent value='bulk-send' className='space-y-4'>
          <div className='grid gap-6 w-full'>
            <BulkSMSSend />
          </div>
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <MessageHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SendSms from './send-sms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReceivedSms from './received-sms'

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
            Bulk Send
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
            <Card>
              <CardHeader>
                <CardTitle>Bulk Send</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-2'>
                    <p>Coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='received' className='space-y-4'>
          <ReceivedSms />
        </TabsContent>
      </Tabs>
    </div>
  )
}

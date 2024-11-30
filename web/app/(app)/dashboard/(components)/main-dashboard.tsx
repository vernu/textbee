'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import Overview from "@/components/overview";
// import DeviceList from "@/components/device-list";
// import ApiKeys from "@/components/api-keys";
// import MessagingPanel from "@/components/messaging-panel";
import { Webhook, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import Overview from './overview'
import DeviceList from './device-list'
import ApiKeys from './api-keys'
import Messaging from './messaging'

export default function DashboardOverview() {
  const router = useRouter()
  const pathname = usePathname()

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
      <TabsList className='sticky top-[3.5rem] z-10 flex mx-auto max-w-md'>
        <TabsTrigger value='overview' className='flex-1'>
          Overview
        </TabsTrigger>
        <TabsTrigger value='messaging' className='relative flex-1'>
          <MessageSquare className='ml-2 h-4 w-4' />
          <span className='mx-2'>Messaging</span>
          <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground ml-8'>
            3
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value='overview' className='space-y-4'>
        <Overview />

        <div className='grid gap-4 md:grid-cols-2'>
          <DeviceList />
          <ApiKeys />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Webhook support is coming soon! You&apos;ll be able to configure
                endpoints to receive SMS notifications in real-time.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='messaging'>
        <Messaging />
      </TabsContent>
    </Tabs>
  )
}

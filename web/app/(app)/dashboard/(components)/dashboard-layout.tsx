'use client'

import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Button } from '@/components/ui/button'
import { QrCode, Heart, UserCircle } from 'lucide-react'
import CommunityAlert from './community-alert'
import MainDashboard from './main-dashboard'
import CommunityLinks from './community-links'
import AccountSettings from './account-settings'
import GenerateApiKey from './generate-api-key'
import { useSession } from 'next-auth/react'

export default function Dashboard({
  children,
}: {
  children?: React.ReactNode
}) {
  const [currentTab, setCurrentTab] = useState('dashboard')

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
  }

  const { data: session } = useSession()

  const welcomeMessage =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
      ? 'Good afternoon'
      : 'Good evening'

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between space-y-2 flex-col md:flex-row'>
        <h2 className='text-3xl font-bold tracking-tight'>
          {welcomeMessage}, {session?.user?.name}
        </h2>
        <div className='flex items-center space-x-2 py-4'>
          <GenerateApiKey />
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className='space-y-4'
      >
        <TabsList className='flex'>
          <TabsTrigger value='dashboard' className='flex-1'>
            Dashboard
          </TabsTrigger>
          <TabsTrigger value='community' className='flex-1'>
            <Heart className='mr-2 h-4 w-4' />
            Community
          </TabsTrigger>
          <TabsTrigger value='account' className='flex-1'>
            <UserCircle className='mr-2 h-4 w-4' />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value='dashboard' className='space-y-4'>
          <CommunityAlert />
          <MainDashboard />
        </TabsContent>

        <TabsContent value='community' className='space-y-4'>
          <CommunityAlert />
          <CommunityLinks />
        </TabsContent>

        <TabsContent value='account' className='space-y-4'>
          <CommunityAlert />
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

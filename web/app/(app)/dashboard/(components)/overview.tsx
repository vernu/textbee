'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Smartphone, Key, MessageSquare } from 'lucide-react'
import GetStartedCard from './get-started'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
// import GetStartedCard from "@/components/get-started-card";

export const StatCard = ({ title, value, icon: Icon, description }) => {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value ?? <Skeleton className='h-4 w-8 mb-2' />}</div>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </CardContent>
    </Card>
  )
}

export default function Overview() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.getStats())
        .then((res) => res.data?.data),
  })

  return (
    <div className='space-y-4'>
      <GetStartedCard />
      <div className='grid gap-4 grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total SMS Sent'
          value={stats?.totalSentSMSCount?.toLocaleString()}
          icon={MessageSquare}
          description='Since last year'
        />
        <StatCard
          title='Active Devices'
          value={stats?.totalDeviceCount}
          icon={Smartphone}
          description='Connected now'
        />
        <StatCard
          title='API Keys'
          value={stats?.totalApiKeyCount}
          icon={Key}
          description='Active keys'
        />
        <StatCard
          title='SMS Received'
          value={stats?.totalReceivedSMSCount?.toLocaleString()}
          icon={BarChart3}
          description='Since last year'
        />
      </div>
    </div>
  )
}

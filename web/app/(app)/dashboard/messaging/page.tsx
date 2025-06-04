'use client'

import { MessageSquareTextIcon } from 'lucide-react'
import Messaging from '../(components)/messaging'
import ApiGuide from './(components)/api-guide'

export default function MessagingPage() {
  return (
    <div className='flex-1 p-6 md:p-8'>
      <div className='space-y-1 mb-6'>
        <div className='flex items-center space-x-2'>
          <MessageSquareTextIcon className='h-6 w-6 text-primary' />
          <h2 className='text-3xl font-bold tracking-tight'>Messaging</h2>
        </div>
        <p className='text-muted-foreground'>
          Send messages and view your SMS history
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div>
          <Messaging />
        </div>

        <div>
          <ApiGuide />
        </div>
      </div>
    </div>
  )
}

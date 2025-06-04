import { MessageSquareIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SupportForm from '../../(components)/support-form'

export default function GetSupportPage() {
  return (
    <div className='flex-1 space-y-6 p-6 md:p-8'>
      <div className='space-y-1'>
        <div className='flex items-center space-x-2'>
          <MessageSquareIcon className='h-6 w-6 text-primary' />
          <h2 className='text-3xl font-bold tracking-tight'>Get Support</h2>
        </div>
        <p className='text-muted-foreground'>Contact our support team for assistance</p>
      </div>

      <div className='max-w-2xl'>
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <SupportForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
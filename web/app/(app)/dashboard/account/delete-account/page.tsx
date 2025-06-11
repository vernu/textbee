import { AlertTriangleIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DeleteAccountForm from '../../(components)/delete-account-form'

export default function DangerZonePage() {
  return (
    <div className='flex-1 space-y-6 p-6 md:p-8'>
      <div className='space-y-1'>
        <div className='flex items-center space-x-2'>
          <AlertTriangleIcon className='h-6 w-6 text-destructive' />
          <h2 className='text-3xl font-bold tracking-tight'>Danger Zone</h2>
        </div>
        <p className='text-muted-foreground'>Manage critical account actions</p>
      </div>

      <div className='max-w-2xl'>
        <Card className='border-destructive/50'>
          <CardHeader>
            <div className='flex items-center gap-2 text-destructive'>
              <AlertTriangleIcon className='h-5 w-5' />
              <CardTitle>Delete Account</CardTitle>
            </div>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
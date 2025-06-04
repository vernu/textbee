import { UserIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import EditProfileForm from '../../(components)/edit-profile-form'

export default function EditProfilePage() {
  return (
    <div className='flex-1 space-y-6 p-6 md:p-8'>
      <div className='space-y-1'>
        <div className='flex items-center space-x-2'>
          <UserIcon className='h-6 w-6 text-primary' />
          <h2 className='text-3xl font-bold tracking-tight'>Edit Profile</h2>
        </div>
        <p className='text-muted-foreground'>Update your profile information</p>
      </div>

      <div className='max-w-2xl'>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <EditProfileForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
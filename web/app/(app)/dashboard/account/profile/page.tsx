import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import EditProfileForm from '../../(components)/account/edit-profile-form'

export default function ProfilePage() {
  return (
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
  )
}

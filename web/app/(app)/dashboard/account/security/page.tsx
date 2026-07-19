import { AlertTriangleIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import ChangePasswordForm from '../../(components)/account/change-password-form'
import DeleteAccountForm from '../../(components)/account/delete-account-form'

// Security: password management, with account deletion in a clearly separated
// destructive card so the two actions can never be confused.
export default function SecurityPage() {
  return (
    <div className='max-w-2xl space-y-8'>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <div className='space-y-3'>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-destructive'>
          Danger zone
        </h3>
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

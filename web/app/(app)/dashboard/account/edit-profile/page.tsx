import { redirect } from 'next/navigation'

// Legacy route: profile editing now lives in the merged account settings.
export default function EditProfilePage() {
  redirect('/dashboard/account/profile')
}

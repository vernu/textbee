import { redirect } from 'next/navigation'

// Legacy route: password management now lives in Account > Security.
export default function ChangePasswordPage() {
  redirect('/dashboard/account/security')
}

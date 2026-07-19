import { redirect } from 'next/navigation'

// Legacy route: account deletion now lives in Account > Security (danger zone).
export default function DeleteAccountPage() {
  redirect('/dashboard/account/security')
}

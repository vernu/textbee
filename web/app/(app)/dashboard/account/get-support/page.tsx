import { redirect } from 'next/navigation'

// Legacy route: support now lives in Account > Support.
export default function GetSupportPage() {
  redirect('/dashboard/account/support')
}

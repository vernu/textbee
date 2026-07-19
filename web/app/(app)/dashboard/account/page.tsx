import { redirect } from 'next/navigation'

// Account is a settings section with subroutes; Billing is the default view.
export default function AccountPage() {
  redirect('/dashboard/account/billing')
}

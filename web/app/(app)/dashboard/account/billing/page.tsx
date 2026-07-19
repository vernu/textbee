import SubscriptionInfo from '../../(components)/billing/subscription-info'

// Billing & plan: current subscription, usage limits and plan CTAs.
export default function BillingPage() {
  return (
    <div className='max-w-2xl'>
      <SubscriptionInfo />
    </div>
  )
}

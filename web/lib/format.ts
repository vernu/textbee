// Shared formatting helpers. These were previously duplicated inline across
// subscription-info, device-list, overview and others.

// A plan limit of -1 means unlimited; null/undefined render as 0.
export function formatLimit(value: number | null | undefined): string {
  if (value === -1) return 'Unlimited'
  if (value == null) return '0'
  return value.toLocaleString()
}

// Amounts come from the backend in minor units (cents). Null amount = Free.
export function formatPrice(
  amount: number | null | undefined,
  currency: string | null | undefined
): string {
  if (amount == null || currency == null) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase() || 'USD',
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

export function getBillingInterval(
  interval: string | null | undefined
): string {
  if (!interval) return ''
  return interval.toLowerCase() === 'month' ? 'monthly' : 'yearly'
}

export function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// "past_due" -> "Past Due"
export function titleCaseStatus(status: string | null | undefined): string {
  if (!status) return ''
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

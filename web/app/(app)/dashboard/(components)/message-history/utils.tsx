import { Check, Timer, X } from 'lucide-react'
import type { ReactNode } from 'react'

// Shared helpers for the message-history screen.

export function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export type StatusBadge = {
  color: string
  icon: ReactNode
  label: string
}

export function getStatusBadge(status: string | undefined): StatusBadge {
  const normalizedStatus = status?.toLowerCase() || 'pending'
  switch (normalizedStatus) {
    case 'pending':
      return {
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: <Timer className='h-3 w-3' />,
        label: 'Pending',
      }
    case 'sent':
      return {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: <Check className='h-3 w-3' />,
        label: 'Sent',
      }
    case 'delivered':
      return {
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <Check className='h-3 w-3' />,
        label: 'Delivered',
      }
    case 'failed':
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: <X className='h-3 w-3' />,
        label: 'Failed',
      }
    default:
      return {
        color: 'bg-muted text-muted-foreground',
        icon: <Timer className='h-3 w-3' />,
        label: normalizedStatus,
      }
  }
}

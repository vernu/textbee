'use client'

import type { ComponentType } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatError } from '@/lib/utils/errorHandler'

type ErrorStateProps = {
  error: unknown
  title?: string
  onRetry?: () => void
  icon?: ComponentType<{ className?: string }>
}

/**
 * Shared error placeholder, the counterpart to EmptyState.
 *
 * Several sections rendered a bare `Error: {error.message}` with no styling
 * and no way to recover, which put raw transport strings like "Request failed
 * with status code 500" in front of users. formatError already knows how to
 * turn an axios rejection into something readable, including rate limits, so
 * this routes everything through it.
 */
export default function ErrorState({
  error,
  title = 'Something went wrong',
  onRetry,
  icon: Icon = AlertCircle,
}: ErrorStateProps) {
  const { message } = formatError(error)

  return (
    <div
      role='alert'
      className='flex flex-col items-center justify-center gap-2 py-12 text-center'
    >
      <div className='rounded-full bg-destructive/10 p-3'>
        <Icon className='h-6 w-6 text-destructive' />
      </div>
      <p className='text-sm font-medium text-foreground'>{title}</p>
      <p className='max-w-sm text-xs text-muted-foreground'>{message}</p>
      {onRetry && (
        <Button variant='outline' size='sm' className='mt-2' onClick={onRetry}>
          <RefreshCw className='mr-1.5 h-3.5 w-3.5' />
          Try again
        </Button>
      )}
    </div>
  )
}

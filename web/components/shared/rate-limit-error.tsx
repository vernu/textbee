'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { RateLimitErrorData } from '@/lib/utils/errorHandler'

interface RateLimitErrorProps {
  errorData?: RateLimitErrorData
  variant?: 'alert' | 'inline'
  className?: string
}

/**
 * Component for displaying rate limit (429) errors with upgrade option
 */
export function RateLimitError({
  errorData,
  variant = 'alert',
  className,
}: RateLimitErrorProps) {
  const message = errorData?.message || 'You have reached your usage limit.'

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col gap-2 ${className || ''}`}>
        <p className="text-sm text-destructive">{message}</p>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="default" size="sm">
            <Link href="/checkout/pro">Upgrade Plan</Link>
          </Button>
          <p className="text-xs text-muted-foreground flex items-center">
            or wait for your limit to reset
          </p>
        </div>
      </div>
    )
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Limit Reached</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 mt-2">
        <p>{message}</p>
        <div className="flex gap-2 flex-wrap items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/checkout/pro">Upgrade Plan</Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            or wait for your limit to reset
          </span>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Formats a rate limit error message for use in toast notifications
 * Since toasts can't contain interactive components, this returns a plain message
 */
export function formatRateLimitMessageForToast(
  errorData?: RateLimitErrorData
): string {
  const baseMessage = errorData?.message || 'You have reached your usage limit.'
  return `${baseMessage} Please upgrade your plan or wait for your limit to reset.`
}

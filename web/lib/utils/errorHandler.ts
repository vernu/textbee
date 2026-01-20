import { AxiosError } from 'axios'

export interface RateLimitErrorData {
  message: string
  hasReachedLimit: boolean
  dailyLimit?: number
  dailyRemaining?: number
  monthlyRemaining?: number
  bulkSendLimit?: number
  monthlyLimit?: number
}

export interface FormattedError {
  message: string
  isRateLimit: boolean
  rateLimitData?: RateLimitErrorData
}

/**
 * Formats axios errors into user-friendly messages
 * Special handling for 429 (rate limit) errors
 */
export function formatError(error: unknown): FormattedError {
  if (!error) {
    return {
      message: 'An unexpected error occurred. Please try again.',
      isRateLimit: false,
    }
  }

  // Check if it's an axios error
  const axiosError = error as AxiosError
  if (axiosError.response) {
    const status = axiosError.response.status
    const data = axiosError.response.data as any

    // Handle 429 rate limit errors
    if (status === 429) {
      const rateLimitData: RateLimitErrorData = {
        message: data?.message || 'Rate limit reached',
        hasReachedLimit: data?.hasReachedLimit ?? true,
        dailyLimit: data?.dailyLimit,
        dailyRemaining: data?.dailyRemaining,
        monthlyRemaining: data?.monthlyRemaining,
        bulkSendLimit: data?.bulkSendLimit,
        monthlyLimit: data?.monthlyLimit,
      }

      return {
        message: rateLimitData.message,
        isRateLimit: true,
        rateLimitData,
      }
    }

    // For other HTTP errors, use the message from the response
    if (data?.message) {
      return {
        message: data.message,
        isRateLimit: false,
      }
    }
  }

  // For non-axios errors or errors without a response
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred. Please try again.',
      isRateLimit: false,
    }
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    isRateLimit: false,
  }
}

/**
 * Checks if an error is a rate limit (429) error
 */
export function isRateLimitError(error: unknown): boolean {
  const formatted = formatError(error)
  return formatted.isRateLimit
}

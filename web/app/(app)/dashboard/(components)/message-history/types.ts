import type { Device } from '@/lib/api'

// Shape of a message row as returned by the device messages endpoint. Kept
// permissive to match the backend payloads (sent and received rows differ).
export type SmsMessage = {
  _id: string
  message?: string
  status?: string
  sender?: string
  recipient?: string
  recipients?: string[]
  requestedAt?: string
  receivedAt?: string
  createdAt?: string
  gatewayMessageId?: string
  errorCode?: string
  errorMessage?: string
  device?: Device
}

export type MessagesPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

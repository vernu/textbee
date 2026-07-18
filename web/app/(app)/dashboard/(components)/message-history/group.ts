import { format, isToday, isValid, isYesterday } from 'date-fns'
import type { SmsMessage } from './types'

export type MessageDay = {
  // Stable key for React and for tests: the calendar day in ISO form.
  key: string
  label: string
  messages: SmsMessage[]
}

/** The timestamp that best represents when a message happened. */
export function messageDate(message: SmsMessage): Date | null {
  const raw =
    message.receivedAt ?? message.requestedAt ?? message.createdAt ?? null
  if (!raw) return null
  const date = new Date(raw)
  return isValid(date) ? date : null
}

/**
 * Direction of a message.
 *
 * Prefer the `type` the API returns. The previous code inferred direction from
 * whether `sender` was present, which is only a proxy, so that check is kept
 * as a fallback for rows written before `type` existed.
 */
export function messageDirection(message: SmsMessage): 'sent' | 'received' {
  if (message.type === 'sent' || message.type === 'received') return message.type
  return message.sender ? 'received' : 'sent'
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'd MMM yyyy')
}

/**
 * Group messages under day headings, preserving the order they arrive in
 * (the API already sorts newest first).
 *
 * Messages with no usable timestamp are grouped last under "Unknown date"
 * rather than silently dropped.
 */
export function groupMessagesByDay(messages: SmsMessage[]): MessageDay[] {
  const days: MessageDay[] = []
  const byKey = new Map<string, MessageDay>()

  for (const message of messages) {
    const date = messageDate(message)
    const key = date ? format(date, 'yyyy-MM-dd') : 'unknown'
    const label = date ? dayLabel(date) : 'Unknown date'

    let group = byKey.get(key)
    if (!group) {
      group = { key, label, messages: [] }
      byKey.set(key, group)
      days.push(group)
    }
    group.messages.push(message)
  }

  // Undated rows sink to the bottom; everything else keeps API order.
  return [
    ...days.filter((d) => d.key !== 'unknown'),
    ...days.filter((d) => d.key === 'unknown'),
  ]
}

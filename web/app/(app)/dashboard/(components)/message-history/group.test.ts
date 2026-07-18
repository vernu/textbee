import { describe, expect, it } from 'vitest'
import { groupMessagesByDay, messageDate, messageDirection } from './group'
import type { SmsMessage } from './types'

const msg = (over: Partial<SmsMessage>): SmsMessage =>
  ({ _id: Math.random().toString(36), message: 'hi', ...over }) as SmsMessage

// Built from local parts so day bucketing does not depend on the suite's TZ.
const at = (daysAgo: number, hour = 12) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

describe('messageDirection', () => {
  it('uses the type the API returns', () => {
    expect(messageDirection(msg({ type: 'received' }))).toBe('received')
    expect(messageDirection(msg({ type: 'sent' }))).toBe('sent')
  })

  it('trusts type over the presence of a sender', () => {
    // A sent row that happens to carry a sender must not flip to received.
    expect(messageDirection(msg({ type: 'sent', sender: '+1415' }))).toBe('sent')
  })

  it('falls back to the sender check for rows written before type existed', () => {
    expect(messageDirection(msg({ sender: '+1415' }))).toBe('received')
    expect(messageDirection(msg({ recipient: '+1415' }))).toBe('sent')
  })
})

describe('messageDate', () => {
  it('prefers receivedAt, then requestedAt, then createdAt', () => {
    const received = at(1)
    const requested = at(2)
    const created = at(3)

    expect(messageDate(msg({ receivedAt: received, createdAt: created }))
      ?.toISOString()).toBe(received)
    expect(messageDate(msg({ requestedAt: requested, createdAt: created }))
      ?.toISOString()).toBe(requested)
    expect(messageDate(msg({ createdAt: created }))?.toISOString()).toBe(created)
  })

  it('returns null when there is no usable timestamp', () => {
    expect(messageDate(msg({}))).toBeNull()
    expect(messageDate(msg({ createdAt: 'nonsense' }))).toBeNull()
  })
})

describe('groupMessagesByDay', () => {
  it('returns nothing for an empty list', () => {
    expect(groupMessagesByDay([])).toEqual([])
  })

  it('labels the current and previous day in words', () => {
    const groups = groupMessagesByDay([
      msg({ createdAt: at(0) }),
      msg({ createdAt: at(1) }),
    ])

    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday'])
  })

  it('uses a date label for older days', () => {
    const groups = groupMessagesByDay([msg({ createdAt: at(10) })])
    expect(groups).toHaveLength(1)
    expect(groups[0].label).not.toBe('Today')
    expect(groups[0].label).not.toBe('Yesterday')
    expect(groups[0].label).toMatch(/\d{1,2} \w{3} \d{4}/)
  })

  it('collects messages from the same day into one group', () => {
    const groups = groupMessagesByDay([
      msg({ createdAt: at(0, 9) }),
      msg({ createdAt: at(0, 17) }),
      msg({ createdAt: at(1, 9) }),
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0].messages).toHaveLength(2)
    expect(groups[1].messages).toHaveLength(1)
  })

  it('separates messages either side of a day boundary', () => {
    // Just before and just after local midnight are different days.
    const groups = groupMessagesByDay([
      msg({ createdAt: at(0, 0) }),
      msg({ createdAt: at(1, 23) }),
    ])
    expect(groups).toHaveLength(2)
  })

  it('keeps undated messages instead of dropping them, sorted last', () => {
    const groups = groupMessagesByDay([
      msg({ _id: 'no-date' }),
      msg({ _id: 'dated', createdAt: at(0) }),
    ])

    expect(groups.map((g) => g.label)).toEqual(['Today', 'Unknown date'])
    expect(groups[1].messages[0]._id).toBe('no-date')
  })

  it('preserves the order the API returned within a day', () => {
    const groups = groupMessagesByDay([
      msg({ _id: 'first', createdAt: at(0, 18) }),
      msg({ _id: 'second', createdAt: at(0, 9) }),
    ])

    expect(groups[0].messages.map((m) => m._id)).toEqual(['first', 'second'])
  })
})

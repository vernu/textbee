import { describe, expect, it } from 'vitest'
import {
  buildRecipientPlan,
  detectRecipientColumn,
  extractTemplateVariables,
  findUnknownVariables,
  formatFileSize,
  isPlausiblePhone,
  normalizePhone,
  renderTemplate,
} from './bulk-csv'

describe('detectRecipientColumn', () => {
  it('finds the obvious column', () => {
    expect(detectRecipientColumn(['name', 'phone', 'code'])).toBe('phone')
  })

  it('is case and separator insensitive', () => {
    expect(detectRecipientColumn(['Name', 'Phone Number'])).toBe('Phone Number')
    expect(detectRecipientColumn(['name', 'MSISDN'])).toBe('MSISDN')
  })

  it('prefers an exact match over a partial one', () => {
    expect(detectRecipientColumn(['phone_type', 'phone'])).toBe('phone')
  })

  it('falls back to a partial match', () => {
    expect(detectRecipientColumn(['customer_mobile_no'])).toBe(
      'customer_mobile_no'
    )
  })

  it('returns undefined when nothing looks like a phone column', () => {
    expect(detectRecipientColumn(['name', 'city', 'total'])).toBeUndefined()
  })

  it('does not let short hints claim unrelated columns', () => {
    // "to" must not match "total", "tel" must not match "hotel".
    expect(detectRecipientColumn(['total', 'hotel', 'country'])).toBeUndefined()
    // But an exact "to" column is still a valid recipient column.
    expect(detectRecipientColumn(['to', 'body'])).toBe('to')
  })
})

describe('normalizePhone', () => {
  it('strips formatting but keeps a leading plus', () => {
    expect(normalizePhone('+1 (415) 555-0101')).toBe('+14155550101')
    expect(normalizePhone(' 415.555.0101 ')).toBe('4155550101')
  })
})

describe('isPlausiblePhone', () => {
  it('accepts common formats', () => {
    expect(isPlausiblePhone('+14155550101')).toBe(true)
    expect(isPlausiblePhone('+1 (415) 555-0101')).toBe(true)
    expect(isPlausiblePhone('0911000001')).toBe(true)
  })

  it('rejects text, empties and impossible lengths', () => {
    expect(isPlausiblePhone('not a number')).toBe(false)
    expect(isPlausiblePhone('')).toBe(false)
    expect(isPlausiblePhone('12345')).toBe(false)
    expect(isPlausiblePhone('1234567890123456789')).toBe(false)
  })
})

describe('buildRecipientPlan', () => {
  const rows = [
    { name: 'Alice', phone: '+14155550101' },
    { name: 'Blank', phone: '' },
    { name: 'Bob', phone: '+16475550187' },
    { name: 'Junk', phone: 'call me' },
    // Same number as Alice in a different format.
    { name: 'Alice again', phone: '+1 (415) 555-0101' },
  ]

  it('keeps only rows that can actually receive a message', () => {
    const plan = buildRecipientPlan(rows, 'phone')

    expect(plan.valid.map((r) => r.raw)).toEqual([
      '+14155550101',
      '+16475550187',
    ])
    expect(plan.counts).toEqual({
      total: 5,
      valid: 2,
      empty: 1,
      invalid: 1,
      duplicate: 1,
    })
  })

  it('explains every exclusion against the user spreadsheet row number', () => {
    const plan = buildRecipientPlan(rows, 'phone')

    // Header is row 1, so the blank row is row 3 in the file.
    expect(plan.excluded).toEqual([
      { rowNumber: 3, raw: '', reason: 'empty' },
      { rowNumber: 5, raw: 'call me', reason: 'invalid' },
      { rowNumber: 6, raw: '+1 (415) 555-0101', reason: 'duplicate' },
    ])
  })

  it('detects duplicates across differing formats', () => {
    const plan = buildRecipientPlan(
      [{ phone: '4155550101' }, { phone: '415-555-0101' }],
      'phone'
    )
    expect(plan.counts.valid).toBe(1)
    expect(plan.counts.duplicate).toBe(1)
  })

  it('carries the full row so templates can use other columns', () => {
    const plan = buildRecipientPlan(rows, 'phone')
    expect(plan.valid[0].data.name).toBe('Alice')
  })
})

describe('templates', () => {
  it('extracts variables regardless of spacing', () => {
    expect(
      extractTemplateVariables('Hi {{name}}, order {{ order_id }} confirmed')
    ).toEqual(['name', 'order_id'])
  })

  it('deduplicates repeated variables', () => {
    expect(extractTemplateVariables('{{ a }} and {{a}}')).toEqual(['a'])
  })

  it('flags variables the CSV cannot fill', () => {
    expect(
      findUnknownVariables('Hi {{ name }}, {{ nickname }}', ['name', 'phone'])
    ).toEqual(['nickname'])
  })

  it('renders a row', () => {
    expect(
      renderTemplate('Hi {{ name }}, your order {{ order_id }} is confirmed.', {
        name: 'Alice',
        order_id: 'ORD-1042',
      })
    ).toBe('Hi Alice, your order ORD-1042 is confirmed.')
  })

  it('renders unknown or missing placeholders as empty', () => {
    expect(renderTemplate('Hi {{ nickname }}!', { name: 'Alice' })).toBe('Hi !')
  })
})

describe('formatFileSize', () => {
  it('never shows raw bytes for large sizes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(512 * 1024)).toBe('512 KB')
    expect(formatFileSize(900)).toBe('900 B')
  })
})

'use client'

import { useState } from 'react'

export const MESSAGE_EVENTS = [
  'MESSAGE_RECEIVED',
  'MESSAGE_SENT',
  'MESSAGE_DELIVERED',
  'MESSAGE_FAILED',
  'UNKNOWN_STATE',
]

export const DATE_RANGE_PRESETS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '90_months', label: 'Last 3 Months' },
  { value: '180', label: 'Last 6 Months' },
  { value: '365', label: 'Last 12 Months' },
  { value: 'custom', label: 'Custom' },
]

function presetToRange(range: string): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  switch (range) {
    case '7':
      start.setDate(end.getDate() - 7)
      break
    case '30':
      start.setDate(end.getDate() - 30)
      break
    case '90':
      start.setDate(end.getDate() - 90)
      break
    case '90_months':
      start.setMonth(end.getMonth() - 3)
      break
    case '180':
      start.setMonth(end.getMonth() - 6)
      break
    case '365':
      start.setMonth(end.getMonth() - 12)
      break
  }
  return { start: start.toISOString(), end: end.toISOString() }
}

// Filter state for the webhook notifications history: device, webhook, event
// type, delivery status, preset/custom date range, and pagination page reset.
export function useWebhookHistoryFilters() {
  const [currentDevice, setCurrentDevice] = useState('all')
  const [currentWebhook, setCurrentWebhook] = useState('all')
  const [eventType, setEventType] = useState('all')
  const [status, setStatus] = useState('all')
  const [dateRange, setDateRange] = useState('90')
  const [openCal, setOpenCal] = useState(false)
  const [dateQuery, setDateQuery] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const resetPage = () => setPage(1)

  const handleDeviceChange = (deviceId: string) => {
    setCurrentDevice(deviceId)
    resetPage()
  }

  const handleWebhookChange = (webhookId: string) => {
    setCurrentWebhook(webhookId)
    resetPage()
  }

  const handleEventTypeChange = (type: string) => {
    setEventType(type)
    resetPage()
  }

  const handleStatusChange = (next: string) => {
    setStatus(next)
    resetPage()
  }

  const handleDateRangeChange = (range: string) => {
    if (range === 'custom') {
      setDateQuery({ start: '', end: '' })
      setDateRange('custom')
      setOpenCal(true)
      return
    }
    setDateQuery(presetToRange(range))
    setDateRange(range)
    resetPage()
  }

  const cancelCustomRange = () => {
    setOpenCal(false)
    setDateRange('90')
    setDateQuery(presetToRange('90'))
  }

  const applyCustomRange = () => {
    resetPage()
    setOpenCal(false)
  }

  return {
    currentDevice,
    currentWebhook,
    eventType,
    status,
    dateRange,
    openCal,
    setOpenCal,
    dateQuery,
    setDateQuery,
    page,
    setPage,
    limit,
    handleDeviceChange,
    handleWebhookChange,
    handleEventTypeChange,
    handleStatusChange,
    handleDateRangeChange,
    cancelCustomRange,
    applyCustomRange,
  }
}

export type WebhookHistoryFilters = ReturnType<typeof useWebhookHistoryFilters>

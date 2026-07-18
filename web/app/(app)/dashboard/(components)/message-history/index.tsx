'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, SearchX, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeviceMessages, useDevices } from '@/lib/api'
import FiltersBar from './filters-bar'
import Pagination from '@/components/shared/numbered-pagination'
import EmptyState from '@/components/shared/empty-state'
import SmsDetailsDialog from './sms-details-dialog'
import { MessageRow, MessageRowSkeleton } from './message-row'
import { groupMessagesByDay } from './group'
import type { MessagesPagination, SmsMessage } from './types'

const SEARCH_DEBOUNCE_MS = 300

// Container for the message-history screen: owns filter/pagination state and
// data fetching; rendering is delegated to the focused subcomponents.
export default function MessageHistory() {
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  // Derived, not synced through an effect: the selected device is whatever the
  // user picked, otherwise the first one. An effect would render once with no
  // device before correcting itself.
  const [pickedDevice, setPickedDevice] = useState('')
  const [messageType, setMessageType] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Two values: what is typed, and what has been committed to the query.
  // Search is server-side, so it is debounced to avoid a request per keystroke.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError,
  } = useDevices()

  const currentDevice = pickedDevice || devices?.[0]?._id || ''

  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch,
  } = useDeviceMessages(currentDevice, {
    type: messageType,
    page,
    limit,
    search,
  })

  const handleRefresh = async () => {
    if (!currentDevice) return
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  useEffect(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    if (autoRefreshInterval > 0 && currentDevice) {
      refreshTimerRef.current = setInterval(() => {
        refetch()
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 300)
      }, autoRefreshInterval * 1000)
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefreshInterval, currentDevice, refetch])

  const messages = (messagesResponse?.data ?? []) as SmsMessage[]
  const pagination: MessagesPagination = {
    page: messagesResponse?.meta?.page ?? 1,
    limit: messagesResponse?.meta?.limit ?? limit,
    total: messagesResponse?.meta?.total ?? 0,
    totalPages: messagesResponse?.meta?.totalPages ?? 1,
  }

  const days = useMemo(() => groupMessagesByDay(messages), [messages])
  const activeDevice = devices?.find((device) => device._id === currentDevice)

  const handleSelectMessage = (message: SmsMessage) => {
    setSelectedMessage(message)
    setIsDetailsDialogOpen(true)
  }

  const handleDeviceChange = (deviceId: string) => {
    setPickedDevice(deviceId)
    setPage(1)
  }

  const handleMessageTypeChange = (type: string) => {
    setMessageType(type)
    setPage(1)
  }

  const clearSearch = () => setSearchInput('')

  if (isLoadingDevices)
    return (
      <div className='space-y-4'>
        <Skeleton className='h-9 w-full' />
        <div className='rounded-xl border border-border'>
          {[1, 2, 3, 4].map((i) => (
            <MessageRowSkeleton key={i} />
          ))}
        </div>
      </div>
    )

  if (devicesError)
    return (
      <div className='flex h-full items-center justify-center'>
        Error: {devicesError.message}
      </div>
    )

  if (!devices?.length)
    return (
      <EmptyState
        icon={Smartphone}
        title='No devices found'
        hint='Register a device to start sending and receiving SMS.'
      />
    )

  return (
    <div className='space-y-4'>
      <FiltersBar
        devices={devices}
        currentDevice={currentDevice}
        onDeviceChange={handleDeviceChange}
        messageType={messageType}
        onMessageTypeChange={handleMessageTypeChange}
        search={searchInput}
        onSearchChange={setSearchInput}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        autoRefreshInterval={autoRefreshInterval}
        onAutoRefreshIntervalChange={setAutoRefreshInterval}
      />

      {messagesError && (
        <div className='flex h-full items-center justify-center'>
          Error: {messagesError.message}
        </div>
      )}

      {isLoadingMessages ? (
        <div className='rounded-xl border border-border'>
          {[1, 2, 3, 4].map((i) => (
            <MessageRowSkeleton key={i} />
          ))}
        </div>
      ) : !messagesError && messages.length === 0 ? (
        // A search that found nothing is a different situation from a device
        // that has never sent a message, and needs a different way out.
        search ? (
          <div className='rounded-xl border border-border'>
            <EmptyState
              icon={SearchX}
              title={`No messages match "${search}"`}
              hint='Try a different number or wording.'
            />
            <div className='flex justify-center pb-6'>
              {/* Says what happens rather than repeating the label on the
                  input's clear icon. */}
              <Button variant='outline' size='sm' onClick={clearSearch}>
                Show all messages
              </Button>
            </div>
          </div>
        ) : (
          <div className='rounded-xl border border-border'>
            <EmptyState
              icon={MessageSquare}
              title='No messages yet'
              hint='Messages sent or received by this device will appear here.'
            />
          </div>
        )
      ) : (
        <div className='overflow-hidden rounded-xl border border-border'>
          {days.map((day) => (
            <section key={day.key}>
              {/* Deliberately not sticky. On mobile it pinned to the same
                  offset as the sticky search bar and landed on top of message
                  rows, translucent, with text bleeding through. On desktop it
                  covered rows scrolled beneath it and swallowed their clicks.
                  A page holds 20 messages, so groups are short and a pinned
                  header bought little in exchange for that. */}
              <h3 className='border-b border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground'>
                {day.label}
              </h3>
              <div className='divide-y divide-border'>
                {day.messages.map((message) => (
                  <MessageRow
                    key={message._id}
                    message={message}
                    device={activeDevice}
                    onSelect={handleSelectMessage}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* A single page needs no pager. */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      {selectedMessage && (
        <SmsDetailsDialog
          message={selectedMessage}
          fallbackDeviceId={currentDevice}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </div>
  )
}

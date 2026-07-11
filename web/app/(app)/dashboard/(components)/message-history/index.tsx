'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Smartphone } from 'lucide-react'
import { useDeviceMessages, useDevices } from '@/lib/api'
import FiltersBar from './filters-bar'
import Pagination from './pagination'
import SmsDetailsDialog from './sms-details-dialog'
import { MessageCard, MessageCardSkeleton } from './message-card'
import type { MessagesPagination, SmsMessage } from './types'

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof MessageSquare
  title: string
  hint?: string
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 py-12 text-center animate-fade-in'>
      <div className='rounded-full bg-muted p-3'>
        <Icon className='h-6 w-6 text-muted-foreground' />
      </div>
      <p className='text-sm font-medium text-foreground'>{title}</p>
      {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </div>
  )
}

// Container for the message-history screen: owns filter/pagination state and
// data fetching; rendering is delegated to the focused subcomponents.
export default function MessageHistory() {
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const [currentDevice, setCurrentDevice] = useState('')
  const [messageType, setMessageType] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError,
  } = useDevices()

  useEffect(() => {
    if (devices?.length && !currentDevice) {
      setCurrentDevice(devices[0]._id)
    }
  }, [devices, currentDevice])

  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch,
  } = useDeviceMessages(currentDevice, { type: messageType, page, limit })

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

  const handleSelectMessage = (message: SmsMessage) => {
    setSelectedMessage(message)
    setIsDetailsDialogOpen(true)
  }

  const handleDeviceChange = (deviceId: string) => {
    setCurrentDevice(deviceId)
    setPage(1)
  }

  const handleMessageTypeChange = (type: string) => {
    setMessageType(type)
    setPage(1)
  }

  if (isLoadingDevices)
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <MessageCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )

  if (devicesError)
    return (
      <div className='flex justify-center items-center h-full'>
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
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        autoRefreshInterval={autoRefreshInterval}
        onAutoRefreshIntervalChange={setAutoRefreshInterval}
      />

      {isLoadingMessages && (
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <MessageCardSkeleton key={i} />
          ))}
        </div>
      )}

      {messagesError && (
        <div className='flex justify-center items-center h-full'>
          Error: {messagesError.message}
        </div>
      )}

      {!isLoadingMessages && !messagesError && messages.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title='No messages found'
          hint='Messages sent or received by this device will appear here.'
        />
      )}

      <div className='space-y-4'>
        {messages.map((message) => (
          <MessageCard
            key={message._id}
            message={message}
            type={message.sender ? 'received' : 'sent'}
            device={devices.find((device) => device._id === currentDevice)}
            onSelectMessage={handleSelectMessage}
          />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {selectedMessage && (
        <SmsDetailsDialog
          message={selectedMessage}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </div>
  )
}

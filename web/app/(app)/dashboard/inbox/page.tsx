'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Inbox as InboxIcon, Calendar, ChevronDown, Search, Edit, Save, X, Plus, MessageSquarePlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { contactsApi } from '@/lib/api/contacts'
import { cn, normalizePhoneNumber, formatMessageTime, groupMessagesWithDateSeparators, MessageWithDate, MessageGroup, getStatusDisplay, MessageStatus } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Conversation {
  phoneNumber: string
  normalizedPhoneNumber: string
  deviceId: string
  contact?: {
    id?: string
    firstName?: string
    lastName?: string
    email?: string
    propertyAddress?: string
    propertyCity?: string
    propertyState?: string
    propertyZip?: string
    parcelCounty?: string
    parcelState?: string
    parcelAcres?: number
    apn?: string
    mailingAddress?: string
    mailingCity?: string
    mailingState?: string
    mailingZip?: string
  }
  lastMessage: {
    message: string
    timestamp: Date
    isIncoming: boolean
  }
  lastMessageDate: Date
  messageCount: number
  unseenCount: number
}

interface Message {
  _id: string
  message: string
  sender?: string
  recipient?: string
  receivedAt?: Date
  requestedAt?: Date
  type: string
  status: string
  device: string | { _id: string }
}

function DateSeparator({ dateLabel }: { dateLabel: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-muted/80 text-muted-foreground text-xs px-3 py-1 rounded-full">
        {dateLabel}
      </div>
    </div>
  )
}

function MessageStatusIndicator({ status, isIncoming }: { status: MessageStatus; isIncoming: boolean }) {
  // Only show status for outgoing messages (sent by user)
  if (isIncoming) return null

  const statusInfo = getStatusDisplay(status)

  return (
    <div className="text-xs text-muted-foreground flex items-center gap-1">
      <span className="font-mono text-xs">
        {statusInfo.icon}
      </span>
      <span>
        {statusInfo.label}
      </span>
    </div>
  )
}

function ConversationRow({
  conversation,
  isSelected,
  onClick
}: {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}) {
  const displayName = conversation.contact?.firstName || conversation.contact?.lastName
    ? `${conversation.contact.firstName || ''} ${conversation.contact.lastName || ''}`.trim()
    : conversation.normalizedPhoneNumber

  const formatDate = (date: Date) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  return (
    <div
      className={cn(
        'p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors',
        isSelected && 'bg-primary/10 border-l-4 border-l-primary'
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-sm truncate",
              conversation.unseenCount > 0 ? "font-semibold text-foreground" : "font-medium"
            )}>
              {displayName}
            </h3>
            {conversation.unseenCount > 0 && (
              <Badge
                variant="default"
                className="h-5 min-w-[20px] px-1.5 text-xs bg-primary text-primary-foreground"
              >
                {conversation.unseenCount}
              </Badge>
            )}
          </div>
          <p className={cn(
            "text-sm truncate mt-1",
            conversation.unseenCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {conversation.lastMessage.isIncoming ? '' : 'You: '}{conversation.lastMessage.message}
          </p>
        </div>
        <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
          {formatDate(conversation.lastMessageDate)}
        </div>
      </div>
    </div>
  )
}

function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  sortBy,
  setSortBy,
  dateFilter,
  setDateFilter,
  dateRange,
  setDateRange,
  searchQuery,
  setSearchQuery,
  onNewMessage
}: {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  sortBy: string
  setSortBy: (value: string) => void
  dateFilter: string
  setDateFilter: (value: string) => void
  dateRange: { from?: Date; to?: Date } | undefined
  setDateRange: (range: { from?: Date; to?: Date } | undefined) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onNewMessage: () => void
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv => {
        const displayName = conv.contact?.firstName || conv.contact?.lastName
          ? `${conv.contact.firstName || ''} ${conv.contact.lastName || ''}`.trim()
          : conv.normalizedPhoneNumber
        return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               conv.normalizedPhoneNumber.includes(searchQuery) ||
               conv.phoneNumber.includes(searchQuery)
      })
    }

    // Apply date filter
    if (dateFilter === 'custom' && dateRange?.from) {
      filtered = filtered.filter(conv => {
        const messageDate = new Date(conv.lastMessageDate)
        if (dateRange.to) {
          return messageDate >= dateRange.from && messageDate <= dateRange.to
        } else {
          return messageDate >= dateRange.from
        }
      })
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
        case 'firstName':
          const nameA = a.contact?.firstName || a.normalizedPhoneNumber
          const nameB = b.contact?.firstName || b.normalizedPhoneNumber
          return nameA.localeCompare(nameB)
        case 'lastName':
          const lastNameA = a.contact?.lastName || a.normalizedPhoneNumber
          const lastNameB = b.contact?.lastName || b.normalizedPhoneNumber
          return lastNameA.localeCompare(lastNameB)
        default:
          return b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
      }
    })

    return sorted
  }, [conversations, searchQuery, dateFilter, dateRange, sortBy])

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <InboxIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Conversations</h2>
          </div>
          <Button
            size="sm"
            onClick={onNewMessage}
            className="gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New message
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by:" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="firstName">First name</SelectItem>
              <SelectItem value="lastName">Last name</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Date:" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === 'custom' && (
            <Button 
              variant="outline" 
              className="justify-start text-left font-normal"
              onClick={() => setShowDatePicker(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {dateRange.from.toLocaleDateString()} -{" "}
                    {dateRange.to.toLocaleDateString()}
                  </>
                ) : (
                  dateRange.from.toLocaleDateString()
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          )}

          {/* Simple date picker dialog for now */}
          <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Date Range</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">From:</label>
                  <Input
                    type="date"
                    value={dateRange?.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setDateRange({ ...dateRange, from: date })
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">To:</label>
                  <Input
                    type="date"
                    value={dateRange?.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setDateRange({ ...dateRange, to: date })
                    }}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowDatePicker(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowDatePicker(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No conversations found
          </div>
        ) : (
          filteredAndSortedConversations.map((conversation, index) => (
            <ConversationRow
              key={`${conversation.normalizedPhoneNumber}-${index}`}
              conversation={conversation}
              isSelected={selectedConversation?.normalizedPhoneNumber === conversation.normalizedPhoneNumber}
              onClick={() => onSelectConversation(conversation)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MessengerInterface({
  conversation,
  allMessages = []
}: {
  conversation: Conversation
  allMessages?: Message[]
}) {
  const [activeTab, setActiveTab] = useState('messages')
  const [newMessage, setNewMessage] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const sendSmsMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!conversation.deviceId) {
        throw new Error('No device available to send message')
      }

      const response = await httpBrowserClient.post(
        ApiEndpoints.gateway.sendSMS(conversation.deviceId),
        {
          deviceId: conversation.deviceId,
          recipients: [conversation.phoneNumber],
          message: messageText
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully."
      })
      queryClient.invalidateQueries({ queryKey: ['all-messages'] })
    },
    onError: (error: any) => {
      console.error('SMS send error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Conversation deviceId:', conversation.deviceId)
      console.error('Phone number:', conversation.phoneNumber)

      toast({
        title: "Failed to send message",
        description: error.response?.data?.message || error.message || "An error occurred while sending the message.",
        variant: "destructive"
      })
    }
  })

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  const displayName = conversation.contact?.firstName || conversation.contact?.lastName
    ? `${conversation.contact.firstName || ''} ${conversation.contact.lastName || ''}`.trim()
    : conversation.normalizedPhoneNumber

  // Filter messages for this conversation
  const conversationMessages = useMemo(() => {
    return allMessages
      .filter(msg => {
        const messageSenderNormalized = msg.sender ? normalizePhoneNumber(msg.sender) : null
        const messageRecipientNormalized = msg.recipient ? normalizePhoneNumber(msg.recipient) : null

        return (
          messageSenderNormalized === conversation.normalizedPhoneNumber ||
          messageRecipientNormalized === conversation.normalizedPhoneNumber
        )
      })
      .sort((a, b) => {
        const dateA = new Date(a.receivedAt || a.requestedAt || 0)
        const dateB = new Date(b.receivedAt || b.requestedAt || 0)
        return dateA.getTime() - dateB.getTime()
      })
  }, [allMessages, conversation.normalizedPhoneNumber])

  // Scroll to bottom when conversation changes or new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [conversation.normalizedPhoneNumber])

  useEffect(() => {
    scrollToBottom()
  }, [conversationMessages.length])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    sendSmsMutation.mutate(newMessage.trim())
    setNewMessage('')
  }

  return (
    <div className="flex flex-col h-full border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{displayName}</h2>
        {conversation.contact?.firstName && (
          <p className="text-sm text-muted-foreground">{conversation.normalizedPhoneNumber}</p>
        )}
      </div>

      {/* Tabs - Messages, Info, Notes */}
      <div className="border-b">
        <div className="flex">
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'messages' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'info' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'notes' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'messages' && (
          <>
            {/* Messages area - takes remaining space and scrolls */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto bg-muted/20"
            >
              <div className="p-4">
                {conversationMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No messages found
                  </div>
                ) : (() => {
                  // Convert messages to the format expected by grouping function
                  const formattedMessages: MessageWithDate[] = conversationMessages.map((message, index) => ({
                    id: `${message._id}-${index}`,
                    message: message.message,
                    date: new Date(message.receivedAt || message.requestedAt || 0),
                    isIncoming: !!message.sender,
                    status: message.status as MessageStatus,
                    originalMessage: message
                  }))

                  // Group messages with date separators
                  const messageGroups = groupMessagesWithDateSeparators(formattedMessages)

                  return messageGroups.map((group, index) => {
                    if (group.type === 'date') {
                      return (
                        <DateSeparator key={`date-${index}`} dateLabel={group.dateLabel!} />
                      )
                    } else {
                      const msg = group.message!
                      return (
                        <div key={msg.id} className="mb-3">
                          <div className={cn(
                            "flex items-center gap-2",
                            msg.isIncoming ? "justify-start" : "justify-end"
                          )}>
                            {!msg.isIncoming && (
                              <div className="text-xs text-muted-foreground">
                                {formatMessageTime(msg.date)}
                              </div>
                            )}
                            <div className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              msg.isIncoming
                                ? "bg-background border text-foreground"
                                : "bg-primary text-primary-foreground"
                            )}>
                              <p>{msg.message}</p>
                            </div>
                            {msg.isIncoming && (
                              <div className="text-xs text-muted-foreground">
                                {formatMessageTime(msg.date)}
                              </div>
                            )}
                          </div>
                          {!msg.isIncoming && msg.status && (
                            <div className="flex justify-end mt-1">
                              <MessageStatusIndicator
                                status={msg.status}
                                isIncoming={msg.isIncoming}
                              />
                            </div>
                          )}
                        </div>
                      )
                    }
                  })
                })()}
              </div>
            </div>

            {/* Message input area - fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t bg-background">
              {!conversation.deviceId && (
                <div className="mb-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                  No device available to send messages
                </div>
              )}
              <div className="flex space-x-2">
                <Input
                  placeholder={conversation.deviceId ? "Type a message..." : "No device available"}
                  className="flex-1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && conversation.deviceId && newMessage.trim()) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={!conversation.deviceId}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendSmsMutation.isPending || !conversation.deviceId}
                >
                  {sendSmsMutation.isPending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'info' && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ContactInfoEditor
              conversation={conversation}
              conversationMessages={conversationMessages}
              onContactUpdated={(updatedContact) => {
                // Force refresh of all related data
                queryClient.invalidateQueries({ queryKey: ['contacts-all'] })
                queryClient.invalidateQueries({ queryKey: ['all-messages'] })
                queryClient.invalidateQueries({ queryKey: ['devices'] })
              }}
            />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex-1 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground">
                Note-taking functionality will be implemented here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactInfoEditor({
  conversation,
  conversationMessages,
  onContactUpdated
}: {
  conversation: Conversation
  conversationMessages: Message[]
  onContactUpdated: (contact: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [localContact, setLocalContact] = useState(conversation.contact)
  const [editData, setEditData] = useState({
    firstName: localContact?.firstName || '',
    lastName: localContact?.lastName || '',
    email: localContact?.email || '',
    dnc: localContact?.dnc ?? null,
    propertyAddress: localContact?.propertyAddress || '',
    propertyCity: localContact?.propertyCity || '',
    propertyState: localContact?.propertyState || '',
    propertyZip: localContact?.propertyZip || '',
    parcelCounty: localContact?.parcelCounty || '',
    parcelState: localContact?.parcelState || '',
    parcelAcres: localContact?.parcelAcres || 0,
    apn: localContact?.apn || '',
    mailingAddress: localContact?.mailingAddress || '',
    mailingCity: localContact?.mailingCity || '',
    mailingState: localContact?.mailingState || '',
    mailingZip: localContact?.mailingZip || '',
  })

  // Update local contact when conversation.contact changes
  useEffect(() => {
    setLocalContact(conversation.contact)
  }, [conversation.contact])

  // Update edit data when localContact changes
  useEffect(() => {
    setEditData({
      firstName: localContact?.firstName || '',
      lastName: localContact?.lastName || '',
      email: localContact?.email || '',
      dnc: localContact?.dnc ?? null,
      propertyAddress: localContact?.propertyAddress || '',
      propertyCity: localContact?.propertyCity || '',
      propertyState: localContact?.propertyState || '',
      propertyZip: localContact?.propertyZip || '',
      parcelCounty: localContact?.parcelCounty || '',
      parcelState: localContact?.parcelState || '',
      parcelAcres: localContact?.parcelAcres || 0,
      apn: localContact?.apn || '',
      mailingAddress: localContact?.mailingAddress || '',
      mailingCity: localContact?.mailingCity || '',
      mailingState: localContact?.mailingState || '',
      mailingZip: localContact?.mailingZip || '',
    })
  }, [localContact])
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const updateContactMutation = useMutation({
    mutationFn: async (data: Partial<typeof editData>) => {
      // Clean up the data - convert empty strings to undefined for optional fields
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === '' ? undefined : value
        ])
      )

      if (localContact?.id) {
        // Update existing contact
        return contactsApi.updateContact(localContact.id, cleanData)
      } else {
        // Create new contact
        return contactsApi.createContact({
          phone: conversation.phoneNumber,
          ...cleanData
        })
      }
    },
    onSuccess: (updatedContact) => {
      toast({
        title: localContact?.id ? "Contact updated" : "Contact created",
        description: localContact?.id
          ? "Contact information has been saved successfully."
          : "Contact record has been created and saved successfully."
      })
      setIsEditing(false)
      // Update local contact state immediately
      setLocalContact(updatedContact)
      onContactUpdated(updatedContact)
      queryClient.invalidateQueries({ queryKey: ['contacts-all'] })
      queryClient.invalidateQueries({ queryKey: ['all-messages'] })
    },
    onError: (error: any) => {
      toast({
        title: conversation.contact?.id ? "Failed to update contact" : "Failed to create contact",
        description: error.response?.data?.message || error.message || "An error occurred while saving the contact.",
        variant: "destructive"
      })
    }
  })

  const handleSave = () => {
    updateContactMutation.mutate(editData)
  }

  const handleCancel = () => {
    setEditData({
      firstName: localContact?.firstName || '',
      lastName: localContact?.lastName || '',
      email: localContact?.email || '',
      dnc: localContact?.dnc ?? null,
      propertyAddress: localContact?.propertyAddress || '',
      propertyCity: localContact?.propertyCity || '',
      propertyState: localContact?.propertyState || '',
      propertyZip: localContact?.propertyZip || '',
      parcelCounty: localContact?.parcelCounty || '',
      parcelState: localContact?.parcelState || '',
      parcelAcres: localContact?.parcelAcres || 0,
      apn: localContact?.apn || '',
      mailingAddress: localContact?.mailingAddress || '',
      mailingCity: localContact?.mailingCity || '',
      mailingState: localContact?.mailingState || '',
      mailingZip: localContact?.mailingZip || '',
    })
    setIsEditing(false)
  }

  const contactFields = [
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'propertyAddress', label: 'Property Address', type: 'text' },
    { key: 'propertyCity', label: 'Property City', type: 'text' },
    { key: 'propertyState', label: 'Property State', type: 'text' },
    { key: 'propertyZip', label: 'Property Zip', type: 'text' },
    { key: 'parcelCounty', label: 'Parcel County', type: 'text' },
    { key: 'parcelState', label: 'Parcel State', type: 'text' },
    { key: 'parcelAcres', label: 'Parcel Acres', type: 'number' },
    { key: 'apn', label: 'APN', type: 'text' },
    { key: 'mailingAddress', label: 'Mailing Address', type: 'text' },
    { key: 'mailingCity', label: 'Mailing City', type: 'text' },
    { key: 'mailingState', label: 'Mailing State', type: 'text' },
    { key: 'mailingZip', label: 'Mailing Zip', type: 'text' },
  ]

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Contact Information</h3>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {localContact?.id ? 'Edit' : 'Add Info'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateContactMutation.isPending}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateContactMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateContactMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <span className="font-medium">Phone:</span> {conversation.normalizedPhoneNumber}
            </div>

            {/* DNC Information */}
            <div className="flex items-center gap-2">
              <span className="font-medium">Do Not Call:</span>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <select
                    value={editData.dnc === null ? 'unknown' : editData.dnc ? 'yes' : 'no'}
                    onChange={(e) => {
                      const value = e.target.value === 'unknown' ? null : e.target.value === 'yes'
                      setEditData(prev => ({ ...prev, dnc: value }))
                    }}
                    className="rounded border border-input px-2 py-1 text-sm"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  localContact?.dnc === true
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : localContact?.dnc === false
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {localContact?.dnc === true ? 'Yes' : localContact?.dnc === false ? 'No' : 'Unknown'}
                </span>
              )}
            </div>

            {/* DNC Last Updated Date */}
            <div className="pl-4">
              <span className="text-xs text-muted-foreground">
                DNC Last Updated: {
                  localContact?.dncUpdatedAt
                    ? new Date(localContact.dncUpdatedAt).toLocaleDateString()
                    : 'Never'
                }
              </span>
            </div>

            {contactFields.map((field) => {
              const value = isEditing ? editData[field.key] : localContact?.[field.key]
              const displayValue = field.type === 'number' && value === 0 ? '' : value

              return (
                <div key={field.key}>
                  <span className="font-medium">{field.label}:</span>{' '}
                  {isEditing ? (
                    <Input
                      type={field.type}
                      value={displayValue || ''}
                      onChange={(e) => {
                        const newValue = field.type === 'number'
                          ? (e.target.value ? parseFloat(e.target.value) : 0)
                          : e.target.value
                        setEditData(prev => ({ ...prev, [field.key]: newValue }))
                      }}
                      className="mt-1"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {displayValue || '-'}
                    </span>
                  )}
                </div>
              )
            })}

            <div>
              <span className="font-medium">Total Messages:</span> {conversationMessages.length}
            </div>
            {conversationMessages.length > 0 && (
              <div>
                <span className="font-medium">First Contact:</span>{' '}
                {new Date(conversationMessages[0].receivedAt || conversationMessages[0].requestedAt || 0).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {!localContact?.id && !isEditing && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
            This contact doesn't have a database record yet. Click "Add Info" to create one and save contact details.
          </div>
        )}
      </div>
    </div>
  )
}

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [sortBy, setSortBy] = useState('newest')
  const [dateFilter, setDateFilter] = useState('all')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMessageSidebar, setShowNewMessageSidebar] = useState(false)
  const [newConversation, setNewConversation] = useState<Conversation | null>(null)
  const [autoRefreshInterval] = useState(15) // Default to 15 seconds
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Record<string, Date>>({})
  const refreshTimerRef = useRef(null)
  const queryClient = useQueryClient()

  // Load conversation read statuses from API
  const { data: readStatuses } = useQuery({
    queryKey: ['conversation-read-statuses'],
    queryFn: async () => {
      const response = await httpBrowserClient.get(ApiEndpoints.users.getConversationReadStatuses())
      const statuses: Record<string, string> = response.data
      const timestamps: Record<string, Date> = {}
      Object.entries(statuses).forEach(([key, value]) => {
        timestamps[key] = new Date(value)
      })
      return timestamps
    }
  })

  // Update local state when API data is loaded
  useEffect(() => {
    if (readStatuses) {
      setLastSeenTimestamps(readStatuses)
    }
  }, [readStatuses])

  // Query devices to get message data
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  // Query contacts for name resolution
  const { data: contactsData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => contactsApi.getContacts({ limit: 1000 }),
  })

  // Query messages from all devices
  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['all-messages'],
    enabled: !!devices?.data?.length,
    queryFn: async () => {
      if (!devices?.data?.length) return []

      const allMessages: Message[] = []

      // Fetch messages from all devices
      for (const device of devices.data) {
        try {
          const response = await httpBrowserClient.get(
            `${ApiEndpoints.gateway.getMessages(device._id)}?type=all&limit=1000`
          )
          if (response.data?.data) {
            allMessages.push(...response.data.data)
          }
        } catch (error) {
          console.error(`Failed to fetch messages for device ${device._id}:`, error)
        }
      }

      return allMessages
    },
  })

  // Setup auto-refresh timer
  useEffect(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    // Set up timer for 15 second auto-refresh
    if (devices?.data?.length) {
      refreshTimerRef.current = setInterval(() => {
        refetch()
      }, autoRefreshInterval * 1000)
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefreshInterval, devices?.data?.length, refetch])

  // Process messages into conversations
  const conversations = useMemo(() => {
    if (!messagesData || !devices?.data) return []

    const conversationMap = new Map<string, Conversation>()
    const contacts = contactsData?.data || []
    const enabledDevices = devices.data.filter(d => d.enabled)

    messagesData.forEach((message: Message) => {
      const rawPhoneNumber = message.sender || message.recipient || 'unknown'
      if (rawPhoneNumber === 'unknown') return

      const normalizedPhoneNumber = normalizePhoneNumber(rawPhoneNumber)

      // Try to find contact by both original and normalized phone numbers
      const contact = contacts.find(c =>
        c.phone === rawPhoneNumber ||
        c.phone === normalizedPhoneNumber ||
        normalizePhoneNumber(c.phone) === normalizedPhoneNumber
      )

      const messageDate = new Date(message.receivedAt || message.requestedAt || new Date())

      const existing = conversationMap.get(normalizedPhoneNumber)
      if (!existing || messageDate > existing.lastMessageDate) {
        // Use the normalized phone number format for consistent display
        const displayPhoneNumber = normalizedPhoneNumber

        // Determine which device to use for this conversation
        // Priority: 1) Device from the latest message, 2) First enabled device
        const messageDeviceId = typeof message.device === 'string' ? message.device : message.device?._id
        const deviceId = messageDeviceId || existing?.deviceId || (enabledDevices[0]?._id)

        // Debug logging
        if (normalizedPhoneNumber && deviceId) {
          console.log(`Device for ${normalizedPhoneNumber}: ${deviceId} (from message: ${messageDeviceId}, enabled devices: ${enabledDevices.map(d => d._id).join(', ')})`)
        }

        conversationMap.set(normalizedPhoneNumber, {
          phoneNumber: displayPhoneNumber,
          normalizedPhoneNumber,
          deviceId,
          contact,
          lastMessage: {
            message: message.message || '',
            timestamp: messageDate,
            isIncoming: !!message.sender
          },
          lastMessageDate: messageDate,
          messageCount: (existing?.messageCount || 0) + 1,
          unseenCount: 0 // Will be calculated later
        })
      } else {
        // Update message count for existing conversation
        existing.messageCount += 1
      }
    })

    // Add new conversation if it doesn't exist in the map
    if (newConversation && !conversationMap.has(newConversation.normalizedPhoneNumber)) {
      conversationMap.set(newConversation.normalizedPhoneNumber, {
        ...newConversation,
        unseenCount: 0 // New conversations start with no unseen messages
      })
    }

    // Final pass: Calculate unseen counts for all conversations
    const conversations = Array.from(conversationMap.values())
    conversations.forEach(conversation => {
      const lastSeen = lastSeenTimestamps[conversation.normalizedPhoneNumber] || new Date(0)

      // Count incoming messages received after last seen timestamp
      const unseenCount = (messagesData || []).filter(message => {
        const messagePhoneNumber = message.sender || message.recipient
        if (!messagePhoneNumber) return false

        const normalizedMessagePhone = normalizePhoneNumber(messagePhoneNumber)
        const messageDate = new Date(message.receivedAt || message.requestedAt || 0)

        return normalizedMessagePhone === conversation.normalizedPhoneNumber &&
               message.sender && // Only count incoming messages
               messageDate > lastSeen
      }).length

      conversation.unseenCount = unseenCount
    })

    return conversations
  }, [messagesData, contactsData, devices?.data, newConversation, lastSeenTimestamps])

  // Function to mark a conversation as seen
  const markConversationAsSeen = async (conversation: Conversation) => {
    const now = new Date()

    // Update local state immediately for responsive UI
    setLastSeenTimestamps(prev => ({
      ...prev,
      [conversation.normalizedPhoneNumber]: now
    }))
    setSelectedConversation(conversation)

    // Save to database
    try {
      await httpBrowserClient.post(ApiEndpoints.users.markConversationAsRead(), {
        normalizedPhoneNumber: conversation.normalizedPhoneNumber,
        lastSeenAt: now.toISOString()
      })
      // Invalidate query to refresh from server
      queryClient.invalidateQueries({ queryKey: ['conversation-read-statuses'] })
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 p-6 md:p-8 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <InboxIcon className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
            </div>
            <p className="text-muted-foreground">
              View and manage your message conversations
            </p>
          </div>
        </div>

        <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-hidden">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <div className="flex h-full">
                <div className="w-1/2 border-r">
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="p-4 border-b">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-1/2">
                  <div className="p-4">
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-6 md:p-8 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <InboxIcon className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
          </div>
          <p className="text-muted-foreground">
            View and manage your message conversations
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-hidden">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="flex h-full">
              {/* Conversation list panel */}
              <div className={selectedConversation || showNewMessageSidebar ? "w-1/2" : "w-full"}>
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={markConversationAsSeen}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onNewMessage={() => setShowNewMessageSidebar(true)}
                />
              </div>

              {/* Messenger interface panel */}
              {selectedConversation && !showNewMessageSidebar && (
                <div className="w-1/2">
                  <MessengerInterface
                    conversation={selectedConversation}
                    allMessages={messagesData || []}
                  />
                </div>
              )}

              {/* New Message Sidebar */}
              {showNewMessageSidebar && (
                <div className="w-1/2">
                  <NewMessageSidebar
                    onClose={() => setShowNewMessageSidebar(false)}
                    onConversationCreated={(conversation) => {
                      setNewConversation(conversation)
                      setSelectedConversation(conversation)
                      setShowNewMessageSidebar(false)
                    }}
                    allMessages={messagesData || []}
                    contacts={contactsData?.data || []}
                    devices={devices?.data || []}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function NewMessageSidebar({
  onClose,
  onConversationCreated,
  allMessages,
  contacts,
  devices
}: {
  onClose: () => void
  onConversationCreated: (conversation: Conversation) => void
  allMessages: Message[]
  contacts: any[]
  devices: any[]
}) {
  const [searchInput, setSearchInput] = useState('')
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [filteredContacts, setFilteredContacts] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [hasSelectedRecipient, setHasSelectedRecipient] = useState(false)
  const [selectedContactChip, setSelectedContactChip] = useState<any>(null)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation])

  // Get messages for current conversation
  const conversationMessages = useMemo(() => {
    if (!currentConversation) return []

    return allMessages
      .filter(msg => {
        const messageSenderNormalized = msg.sender ? normalizePhoneNumber(msg.sender) : null
        const messageRecipientNormalized = msg.recipient ? normalizePhoneNumber(msg.recipient) : null

        return (
          messageSenderNormalized === currentConversation.normalizedPhoneNumber ||
          messageRecipientNormalized === currentConversation.normalizedPhoneNumber
        )
      })
      .sort((a, b) => {
        const dateA = new Date(a.receivedAt || a.requestedAt || 0)
        const dateB = new Date(b.receivedAt || b.requestedAt || 0)
        return dateA.getTime() - dateB.getTime()
      })
  }, [allMessages, currentConversation])

  // Filter contacts based on search input
  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredContacts([])
      setShowSuggestions(false)
      return
    }

    const filtered = contacts.filter(contact => {
      const searchLower = searchInput.toLowerCase()
      const firstName = contact.firstName?.toLowerCase() || ''
      const lastName = contact.lastName?.toLowerCase() || ''
      const phone = contact.phone || ''

      return firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             phone.includes(searchInput) ||
             normalizePhoneNumber(phone).includes(searchInput)
    }).slice(0, 5) // Limit to 5 suggestions

    setFilteredContacts(filtered)
    setShowSuggestions(true)
  }, [searchInput, contacts])

  // Handle contact selection
  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact)
    setSelectedContactChip(contact)
    setPhoneNumber(contact.phone)
    setSearchInput('')
    setShowSuggestions(false)
    setHasSelectedRecipient(true)

    // Create conversation with existing messages
    const conversation = createConversation(contact.phone, contact)
    setCurrentConversation(conversation)
  }

  // Handle manual phone number input
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value)

    // Clear previous state if not selecting from contacts
    if (!selectedContact && !selectedContactChip) {
      setCurrentConversation(null)
      setPhoneNumber('')
      setHasSelectedRecipient(false)
    }
  }

  // Validate phone number format
  const isValidPhoneNumber = (phoneStr: string) => {
    const cleanInput = phoneStr.replace(/\D/g, '')
    return cleanInput.length >= 10
  }

  // Handle phone number confirmation (called when user presses Enter or starts typing message)
  const confirmPhoneNumberInput = () => {
    if (!searchInput || selectedContact || selectedContactChip) return

    if (isValidPhoneNumber(searchInput)) {
      setPhoneNumber(searchInput)
      setHasSelectedRecipient(true)
      setShowSuggestions(false)

      // Try to find matching contact by phone number
      const normalizedInput = normalizePhoneNumber(searchInput)
      const matchingContact = contacts.find(c =>
        c.phone === searchInput ||
        c.phone === normalizedInput ||
        normalizePhoneNumber(c.phone) === normalizedInput
      )

      if (matchingContact) {
        // If we found a matching contact, set it as selected
        setSelectedContact(matchingContact)
        setSelectedContactChip(matchingContact)
      }

      // Create conversation for phone number with matched contact (if any)
      const conversation = createConversation(searchInput, matchingContact)
      setCurrentConversation(conversation)
    }
  }

  // Handle key presses for Tab selection, Enter confirmation, and backspace
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && filteredContacts.length > 0) {
      e.preventDefault()
      handleContactSelect(filteredContacts[0])
    } else if (e.key === 'Enter') {
      e.preventDefault()
      confirmPhoneNumberInput()
    } else if (e.key === 'Backspace' && searchInput === '' && selectedContactChip) {
      // Delete the selected contact chip
      setSelectedContactChip(null)
      setSelectedContact(null)
      setPhoneNumber('')
      setCurrentConversation(null)
      setHasSelectedRecipient(false)
    }
  }

  // Clear selection function
  const clearSelection = () => {
    setSelectedContactChip(null)
    setSelectedContact(null)
    setPhoneNumber('')
    setCurrentConversation(null)
    setHasSelectedRecipient(false)
    setSearchInput('')
  }

  // Create conversation from contact or phone number
  const createConversation = (targetPhone: string, contact?: any): Conversation => {
    const normalizedPhone = normalizePhoneNumber(targetPhone)

    // Find existing messages for this phone number
    const existingMessages = allMessages.filter(msg => {
      const msgSender = msg.sender ? normalizePhoneNumber(msg.sender) : null
      const msgRecipient = msg.recipient ? normalizePhoneNumber(msg.recipient) : null
      return msgSender === normalizedPhone || msgRecipient === normalizedPhone
    })

    // Get the most recent message for last message info
    const sortedMessages = existingMessages.sort((a, b) => {
      const dateA = new Date(a.receivedAt || a.requestedAt || 0)
      const dateB = new Date(b.receivedAt || b.requestedAt || 0)
      return dateB.getTime() - dateA.getTime()
    })

    const lastMessage = sortedMessages[0]
    const deviceId = devices[0]?._id || ''

    return {
      phoneNumber: targetPhone,
      normalizedPhoneNumber: normalizedPhone,
      deviceId,
      contact,
      lastMessage: lastMessage ? {
        message: lastMessage.message,
        timestamp: new Date(lastMessage.receivedAt || lastMessage.requestedAt || new Date()),
        isIncoming: !!lastMessage.sender
      } : {
        message: '',
        timestamp: new Date(),
        isIncoming: false
      },
      lastMessageDate: lastMessage
        ? new Date(lastMessage.receivedAt || lastMessage.requestedAt || new Date())
        : new Date(),
      messageCount: existingMessages.length
    }
  }

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ phone, messageText }: { phone: string, messageText: string }) => {
      const enabledDevice = devices.find(d => d.enabled)
      if (!enabledDevice) {
        throw new Error('No enabled device available to send message')
      }

      const response = await httpBrowserClient.post(
        ApiEndpoints.gateway.sendSMS(enabledDevice._id),
        {
          deviceId: enabledDevice._id,
          recipients: [phone],
          message: messageText
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully."
      })

      // Create and return the conversation (use current conversation if available)
      const conversation = currentConversation || createConversation(phoneNumber, selectedContact)
      onConversationCreated(conversation)

      // Reset message and close sidebar after successful send
      setMessage('')
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.response?.data?.message || error.message || "An error occurred while sending the message.",
        variant: "destructive"
      })
    }
  })

  const handleSendMessage = () => {
    if (!currentConversation || !message.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a contact and enter a message.",
        variant: "destructive"
      })
      return
    }

    sendMessageMutation.mutate({ phone: currentConversation.phoneNumber, messageText: message })
  }


  const displayName = currentConversation?.contact?.firstName || currentConversation?.contact?.lastName
    ? `${currentConversation.contact.firstName || ''} ${currentConversation.contact.lastName || ''}`.trim()
    : currentConversation?.normalizedPhoneNumber || 'New Message'


  const enabledDevice = devices.find(d => d.enabled)

  return (
    <div className="flex flex-col h-full border-l overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{displayName}</h2>
          {currentConversation?.contact?.firstName && (
            <p className="text-sm text-muted-foreground">{currentConversation.normalizedPhoneNumber}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Recipient Selection */}
      <div className="p-4 border-b">
        <div className="relative">
          <label className="text-sm font-medium mb-2 block">To:</label>

          {/* Selected Contact Chip or Input */}
          <div className="flex flex-wrap gap-2 min-h-[40px] items-center border border-gray-200 rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            {selectedContactChip && (
              <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm border border-blue-200">
                <span>
                  {selectedContactChip.firstName || selectedContactChip.lastName
                    ? `${selectedContactChip.firstName || ''} ${selectedContactChip.lastName || ''}`.trim()
                    : selectedContactChip.phone
                  }
                </span>
                <button
                  onClick={clearSelection}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {phoneNumber && !selectedContactChip && (
              <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm border border-gray-200">
                <span>{phoneNumber}</span>
                <button
                  onClick={clearSelection}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {!selectedContactChip && !phoneNumber && (
              <Input
                placeholder="Enter phone number, first name, or last name"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => {if (filteredContacts.length > 0) setShowSuggestions(true)}}
                className="border-0 focus:ring-0 flex-1 pl-2 pr-2 py-1 min-w-0"
              />
            )}
          </div>

          {/* Contact Suggestions */}
          {showSuggestions && filteredContacts.length > 0 && !selectedContactChip && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className={cn(
                    "p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0",
                    index === 0 && "bg-blue-50"
                  )}
                  onClick={() => handleContactSelect(contact)}
                >
                  <div className="font-medium">
                    {contact.firstName || contact.lastName
                      ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                      : contact.phone
                    }
                  </div>
                  <div className="text-sm text-gray-500">{contact.phone}</div>
                  {index === 0 && (
                    <div className="text-xs text-blue-600 mt-1">Press Tab to select</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-muted/20">
        {currentConversation ? (
          <div className="p-4">
            {conversationMessages?.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (() => {
              // Convert messages to the format expected by grouping function
              const formattedMessages: MessageWithDate[] = conversationMessages?.map((message, index) => ({
                id: `${message._id}-${index}`,
                message: message.message,
                date: new Date(message.receivedAt || message.requestedAt || 0),
                isIncoming: !!message.sender,
                status: message.status as MessageStatus,
                originalMessage: message
              })) || []

              // Group messages with date separators
              const messageGroups = groupMessagesWithDateSeparators(formattedMessages)

              return (
                <>
                  {messageGroups.map((group, index) => {
                    if (group.type === 'date') {
                      return (
                        <DateSeparator key={`date-${index}`} dateLabel={group.dateLabel!} />
                      )
                    } else {
                      const msg = group.message!
                      return (
                        <div key={msg.id} className="mb-3">
                          <div className={cn(
                            "flex items-center gap-2",
                            msg.isIncoming ? "justify-start" : "justify-end"
                          )}>
                            {!msg.isIncoming && (
                              <div className="text-xs text-muted-foreground">
                                {formatMessageTime(msg.date)}
                              </div>
                            )}
                            <div className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              msg.isIncoming
                                ? "bg-background border text-foreground"
                                : "bg-primary text-primary-foreground"
                            )}>
                              <p>{msg.message}</p>
                            </div>
                            {msg.isIncoming && (
                              <div className="text-xs text-muted-foreground">
                                {formatMessageTime(msg.date)}
                              </div>
                            )}
                          </div>
                          {!msg.isIncoming && msg.status && (
                            <div className="flex justify-end mt-1">
                              <MessageStatusIndicator
                                status={msg.status}
                                isIncoming={msg.isIncoming}
                              />
                            </div>
                          )}
                        </div>
                      )
                    }
                  })}
                  <div ref={messagesEndRef} />
                </>
              )
            })()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-center p-8">
            <div>
              <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">Start a new conversation</p>
              <p className="text-sm">Enter a phone number or search for a contact above</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        {!enabledDevice && (
          <div className="mb-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            No enabled device available to send messages
          </div>
        )}
        <div className="flex space-x-2">
          <Input
            placeholder={enabledDevice ? "Type a message..." : "No device available"}
            className="flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={confirmPhoneNumberInput}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && enabledDevice && message.trim() && hasSelectedRecipient) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={!enabledDevice}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending || !enabledDevice || !hasSelectedRecipient || (currentConversation && !isValidPhoneNumber(currentConversation?.phoneNumber || ''))}
          >
            {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
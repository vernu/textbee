'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Inbox as InboxIcon, Calendar, ChevronDown, Search, Edit, Save, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { cn, normalizePhoneNumber } from '@/lib/utils'
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
    : conversation.phoneNumber

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
          <h3 className="font-medium text-sm truncate">{displayName}</h3>
          <p className="text-sm text-muted-foreground truncate mt-1">
            {conversation.lastMessage.message}
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
  setSearchQuery
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
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv => {
        const displayName = conv.contact?.firstName || conv.contact?.lastName
          ? `${conv.contact.firstName || ''} ${conv.contact.lastName || ''}`.trim()
          : conv.phoneNumber
        return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          const nameA = a.contact?.firstName || a.phoneNumber
          const nameB = b.contact?.firstName || b.phoneNumber
          return nameA.localeCompare(nameB)
        case 'lastName':
          const lastNameA = a.contact?.lastName || a.phoneNumber
          const lastNameB = b.contact?.lastName || b.phoneNumber
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
        <div className="flex items-center space-x-2">
          <InboxIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Conversations</h2>
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
    : conversation.phoneNumber

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

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="flex flex-col h-full border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{displayName}</h2>
        {conversation.contact?.firstName && (
          <p className="text-sm text-muted-foreground">{conversation.phoneNumber}</p>
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
              <div className="p-4 space-y-3">
                {conversationMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No messages found
                  </div>
                ) : (
                  conversationMessages.map((message, index) => {
                    const isIncoming = !!message.sender
                    const messageDate = new Date(message.receivedAt || message.requestedAt || 0)

                    return (
                      <div key={`${message._id}-${index}`} className={cn(
                        "flex",
                        isIncoming ? "justify-start" : "justify-end"
                      )}>
                        <div className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          isIncoming
                            ? "bg-background border text-foreground"
                            : "bg-primary text-primary-foreground"
                        )}>
                          <p>{message.message}</p>
                          <div className={cn(
                            "text-xs mt-1",
                            isIncoming ? "text-muted-foreground" : "text-primary-foreground/70"
                          )}>
                            {formatMessageTime(messageDate)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
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
              <span className="font-medium">Phone:</span> {conversation.phoneNumber}
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
  const { data: messagesData, isLoading } = useQuery({
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
        // Use the original phone number format for display, but group by normalized
        const displayPhoneNumber = existing?.phoneNumber || rawPhoneNumber

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
          messageCount: (existing?.messageCount || 0) + 1
        })
      } else {
        // Update message count for existing conversation
        existing.messageCount += 1
      }
    })

    return Array.from(conversationMap.values())
  }, [messagesData, contactsData, devices?.data])

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-8">
        <div className="space-y-1 mb-6">
          <div className="flex items-center space-x-2">
            <InboxIcon className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
          </div>
          <p className="text-muted-foreground">
            View and manage your message conversations
          </p>
        </div>

        <Card className="h-[600px]">
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
    )
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      <div className="space-y-1 mb-6">
        <div className="flex items-center space-x-2">
          <InboxIcon className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
        </div>
        <p className="text-muted-foreground">
          View and manage your message conversations
        </p>
      </div>

      <Card className="h-[600px]">
        <CardContent className="p-0 h-full">
          <div className="flex h-full">
            {/* Conversation list panel */}
            <div className={selectedConversation ? "w-1/2" : "w-full"}>
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={setSelectedConversation}
                sortBy={sortBy}
                setSortBy={setSortBy}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                dateRange={dateRange}
                setDateRange={setDateRange}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* Messenger interface panel */}
            {selectedConversation && (
              <div className="w-1/2">
                <MessengerInterface 
                  conversation={selectedConversation} 
                  allMessages={messagesData || []}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
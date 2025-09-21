'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Upload,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Edit,
  Save,
  X,
  MessageSquare,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { contactsApi, ContactSpreadsheet, Contact, downloadBlob } from '@/lib/api/contacts'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { cn, normalizePhoneNumber, formatMessageTime, groupMessagesWithDateSeparators, MessageWithDate, MessageGroup, getStatusDisplay, MessageStatus } from '@/lib/utils'
import CsvPreviewDialog from './(components)/csv-preview-dialog'
import ProcessingDetailsDialog from './(components)/processing-details-dialog'

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

function ContactSidebar({
  contact,
  onClose
}: {
  contact: Contact
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState('info')
  const [newMessage, setNewMessage] = useState('')
  const [autoRefreshInterval] = useState(15) // Default to 15 seconds
  const refreshTimerRef = useRef(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch contact groups
  const { data: contactGroups = [] } = useQuery({
    queryKey: ['contact-groups', contact.id],
    queryFn: () => contactsApi.getContactGroups(contact.id),
    enabled: !!contact.id,
  })

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  const { data: messagesData, refetch } = useQuery({
    queryKey: ['contact-messages', contact.phone],
    enabled: !!devices?.data?.length,
    queryFn: async () => {
      if (!devices?.data?.length) return []

      const allMessages: Message[] = []
      const normalizedContactPhone = normalizePhoneNumber(contact.phone)

      for (const device of devices.data) {
        try {
          const response = await httpBrowserClient.get(
            `${ApiEndpoints.gateway.getMessages(device._id)}?type=all&limit=1000`
          )
          if (response.data?.data) {
            const contactMessages = response.data.data.filter((msg: Message) => {
              const messageSenderNormalized = msg.sender ? normalizePhoneNumber(msg.sender) : null
              const messageRecipientNormalized = msg.recipient ? normalizePhoneNumber(msg.recipient) : null

              return (
                messageSenderNormalized === normalizedContactPhone ||
                messageRecipientNormalized === normalizedContactPhone
              )
            })
            allMessages.push(...contactMessages)
          }
        } catch (error) {
          console.error(`Failed to fetch messages for device ${device._id}:`, error)
        }
      }

      return allMessages.sort((a, b) => {
        const dateA = new Date(a.receivedAt || a.requestedAt || 0)
        const dateB = new Date(b.receivedAt || b.requestedAt || 0)
        return dateA.getTime() - dateB.getTime()
      })
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
  }, [autoRefreshInterval, devices?.data?.length, refetch, contact.phone])

  // Mark conversation as read when messages tab is viewed
  const markConversationAsRead = useCallback(async () => {
    try {
      const normalizedPhoneNumber = normalizePhoneNumber(contact.phone)
      await httpBrowserClient.post(ApiEndpoints.users.markConversationAsRead(), {
        normalizedPhoneNumber,
        lastSeenAt: new Date().toISOString()
      })
      queryClient.invalidateQueries({ queryKey: ['conversation-read-statuses'] })
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }, [contact.phone, queryClient])

  // Scroll to bottom when messages tab is active and messages are loaded
  useEffect(() => {
    if (activeTab === 'messages' && messagesData && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeTab, messagesData])

  // Mark conversation as read when messages tab is viewed
  useEffect(() => {
    if (activeTab === 'messages' && messagesData) {
      markConversationAsRead()
    }
  }, [activeTab, messagesData, markConversationAsRead])

  const sendSmsMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const enabledDevice = devices?.data?.find(d => d.enabled)
      if (!enabledDevice) {
        throw new Error('No enabled device available to send message')
      }

      const response = await httpBrowserClient.post(
        ApiEndpoints.gateway.sendSMS(enabledDevice._id),
        {
          deviceId: enabledDevice._id,
          recipients: [contact.phone],
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
      queryClient.invalidateQueries({ queryKey: ['contact-messages', contact.phone] })
      // Scroll to bottom after sending message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
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
    if (!newMessage.trim()) return
    sendSmsMutation.mutate(newMessage.trim())
    setNewMessage('')
  }

  const displayName = contact.firstName || contact.lastName
    ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
    : contact.phone

  const enabledDevice = devices?.data?.find(d => d.enabled)

  return (
    <div className="flex flex-col h-full border-l overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{displayName}</h2>
          {contact.firstName && (
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

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
            <MessageSquare className="h-4 w-4 mr-2 inline" />
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

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'messages' && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto bg-muted/20">
              <div className="p-4">
                {messagesData?.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No messages found
                  </div>
                ) : (() => {
                  // Convert messages to the format expected by grouping function
                  const formattedMessages: MessageWithDate[] = messagesData?.map((message, index) => ({
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
            </div>

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
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && enabledDevice && newMessage.trim()) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={!enabledDevice}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendSmsMutation.isPending || !enabledDevice}
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
              contact={contact}
              conversationMessages={messagesData || []}
              contactGroups={contactGroups}
              onContactUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ['contacts-all'] })
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
  contact,
  conversationMessages = [],
  contactGroups = [],
  onContactUpdated
}: {
  contact: Contact
  conversationMessages?: Message[]
  contactGroups?: string[]
  onContactUpdated: (contact: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [localContact, setLocalContact] = useState(contact)
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

  useEffect(() => {
    setLocalContact(contact)
  }, [contact])

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
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === '' ? undefined : value
        ])
      )

      return contactsApi.updateContact(localContact.id, cleanData)
    },
    onSuccess: (updatedContact) => {
      toast({
        title: "Contact updated",
        description: "Contact information has been saved successfully."
      })
      setIsEditing(false)
      setLocalContact(updatedContact)
      onContactUpdated(updatedContact)
      queryClient.invalidateQueries({ queryKey: ['contacts-all'] })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update contact",
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
              Edit
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
              <span className="font-medium">Phone:</span> {contact.phone}
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

            {/* Groups Information */}
            <div className="border-t pt-3 mt-3">
              <div className="text-sm">
                <span className="font-medium">Groups:</span>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {contactGroups.length > 0 ? (
                    contactGroups.map((group, index) => (
                      <li key={index}>{group}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No groups</li>
                  )}
                </ul>
              </div>
            </div>

            {conversationMessages.length > 0 && (
              <>
                <div>
                  <span className="font-medium">Total Messages:</span> {conversationMessages.length}
                </div>
                <div>
                  <span className="font-medium">First Contact:</span>{' '}
                  {new Date(conversationMessages[0].receivedAt || conversationMessages[0].requestedAt || 0).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const [selectedMode, setSelectedMode] = useState<'spreadsheets' | 'all'>('spreadsheets')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayCount, setDisplayCount] = useState(25)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a' | 'status'>('newest')
  const [spreadsheetSortBy, setSpreadsheetSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a' | 'status'>('newest')
  const [spreadsheetSortOrder, setSpreadsheetSortOrder] = useState<'asc' | 'desc'>('desc')
  const [contactSortBy, setContactSortBy] = useState<'firstName' | 'lastName' | 'phone' | 'email'>('firstName')
  const [contactSortOrder, setContactSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [createContactOpen, setCreateContactOpen] = useState(false)
  const [createContactData, setCreateContactData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dnc: null as boolean | null,
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    parcelCounty: '',
    parcelState: '',
    parcelAcres: 0,
    apn: '',
    mailingAddress: '',
    mailingCity: '',
    mailingState: '',
    mailingZip: '',
  })

  const [files, setFiles] = useState<ContactSpreadsheet[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean
    spreadsheetId: string
    fileName: string
    fileContent: string
  }>({
    open: false,
    spreadsheetId: '',
    fileName: '',
    fileContent: '',
  })

  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    spreadsheet: ContactSpreadsheet | null
  }>({
    open: false,
    spreadsheet: null,
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()


  // Load data on component mount and when parameters change
  useEffect(() => {
    if (selectedMode === 'spreadsheets') {
      loadSpreadsheets()
    } else {
      // Add small delay to prevent rate limiting on rapid sort changes
      const timer = setTimeout(() => {
        loadContacts()
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [selectedMode, searchQuery, sortBy, spreadsheetSortBy, spreadsheetSortOrder, contactSortBy, contactSortOrder, displayCount, currentPage])

  const loadSpreadsheets = async () => {
    try {
      setLoading(true)
      const response = await contactsApi.getSpreadsheets({
        search: searchQuery || undefined,
        sortBy,
        limit: displayCount,
        page: currentPage,
      })
      setFiles(response.data)
    } catch (error) {
      console.error('Error loading spreadsheets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load contact spreadsheets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    if (isLoadingContacts) return // Prevent concurrent requests
    
    try {
      setIsLoadingContacts(true)
      setLoading(true)
      
      const response = await contactsApi.getContacts({
        search: searchQuery || undefined,
        sortBy: contactSortBy,
        sortOrder: contactSortOrder,
        limit: displayCount,
        page: currentPage,
      })

      setContacts(response.data)
      setFilteredContactsTotal(response.total)
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setIsLoadingContacts(false)
    }
  }

  // Use files/contacts directly since API handles filtering and sorting for most cases
  // But apply client-side sorting for Status column since it's not handled by backend
  const filteredAndSortedFiles = useMemo(() => {
    if (spreadsheetSortBy === 'status') {
      const sorted = [...files].sort((a, b) => {
        const statusOrder = { pending: 0, processed: 1 }
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 2
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 2

        if (spreadsheetSortOrder === 'asc') {
          return aOrder - bOrder
        } else {
          return bOrder - aOrder
        }
      })
      return sorted
    }
    return files
  }, [files, spreadsheetSortBy, spreadsheetSortOrder])

  const filteredAndSortedContacts = useMemo(() => {
    // The API handles all sorting now
    return contacts
  }, [contacts])

  const [totalContacts, setTotalContacts] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [filteredContactsTotal, setFilteredContactsTotal] = useState(0)

  // Load stats separately
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const stats = await contactsApi.getStats()
      setTotalContacts(stats.totalContacts)
      setTotalFiles(stats.totalSpreadsheets)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const createContactMutation = useMutation({
    mutationFn: async (data: typeof createContactData) => {
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === '' ? undefined : value
        ])
      )
      return contactsApi.createContact(cleanData)
    },
    onSuccess: (newContact) => {
      toast({
        title: "Contact created",
        description: "New contact has been created successfully."
      })
      setCreateContactOpen(false)
      setCreateContactData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        dnc: null,
        propertyAddress: '',
        propertyCity: '',
        propertyState: '',
        propertyZip: '',
        parcelCounty: '',
        parcelState: '',
        parcelAcres: 0,
        apn: '',
        mailingAddress: '',
        mailingCity: '',
        mailingState: '',
        mailingZip: '',
      })
      // Refresh contacts list and stats
      if (selectedMode === 'all') {
        loadContacts()
      }
      loadStats()
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create contact",
        description: error.response?.data?.message || error.message || "An error occurred while creating the contact.",
        variant: "destructive"
      })
    }
  })

  const handleCreateContact = () => {
    if (!createContactData.phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number for the contact.",
        variant: "destructive"
      })
      return
    }
    createContactMutation.mutate(createContactData)
  }

  const deleteContactsMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      if (contactIds.length === 1) {
        return contactsApi.deleteContact(contactIds[0])
      } else {
        return contactsApi.deleteMultipleContacts(contactIds)
      }
    },
    onSuccess: () => {
      const contactCount = selectedContacts.length
      const contactText = contactCount === 1 ? 'contact' : 'contacts'

      toast({
        title: "Success",
        description: `Deleted ${contactCount} ${contactText} successfully`
      })

      // Clear selection and reload data
      setSelectedContacts([])
      loadContacts()
      loadStats()
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || error.message || "Failed to delete contacts",
        variant: "destructive"
      })
    }
  })

  const handleDeleteSelectedContacts = async () => {
    if (selectedContacts.length === 0) return

    const contactCount = selectedContacts.length
    const contactText = contactCount === 1 ? 'contact' : 'contacts'

    if (!confirm(`Are you sure you want to permanently delete ${contactCount} ${contactText}? This action cannot be undone.`)) {
      return
    }

    deleteContactsMutation.mutate(selectedContacts)
  }

  const contactFields = [
    { key: 'firstName', label: 'First Name', type: 'text', required: false },
    { key: 'lastName', label: 'Last Name', type: 'text', required: false },
    { key: 'phone', label: 'Phone', type: 'tel', required: true },
    { key: 'email', label: 'Email', type: 'email', required: false },
    { key: 'dnc', label: 'Do Not Call', type: 'select', required: false },
    { key: 'propertyAddress', label: 'Property Address', type: 'text', required: false },
    { key: 'propertyCity', label: 'Property City', type: 'text', required: false },
    { key: 'propertyState', label: 'Property State', type: 'text', required: false },
    { key: 'propertyZip', label: 'Property Zip', type: 'text', required: false },
    { key: 'parcelCounty', label: 'Parcel County', type: 'text', required: false },
    { key: 'parcelState', label: 'Parcel State', type: 'text', required: false },
    { key: 'parcelAcres', label: 'Parcel Acres', type: 'number', required: false },
    { key: 'apn', label: 'APN', type: 'text', required: false },
    { key: 'mailingAddress', label: 'Mailing Address', type: 'text', required: false },
    { key: 'mailingCity', label: 'Mailing City', type: 'text', required: false },
    { key: 'mailingState', label: 'Mailing State', type: 'text', required: false },
    { key: 'mailingZip', label: 'Mailing Zip', type: 'text', required: false },
  ]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(filteredAndSortedFiles.map(file => file.id))
    } else {
      setSelectedFiles([])
    }
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId])
    } else {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId))
    }
  }

  const handleSelectAllContacts = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(filteredAndSortedContacts.map(contact => contact.id))
    } else {
      setSelectedContacts([])
    }
  }

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId])
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a CSV file',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploading(true)
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim() !== '')
          const contactCount = Math.max(0, lines.length - 1)
          
          // Convert to base64 for API
          const fileContent = btoa(text)
          
          const uploadedSpreadsheet = await contactsApi.uploadSpreadsheet({
            originalFileName: file.name,
            fileContent,
            contactCount,
            fileSize: file.size,
          })
          
          toast({
            title: 'Success',
            description: 'Contact spreadsheet uploaded successfully',
          })
          
          // Reload data
          await loadSpreadsheets()
          await loadStats()
          
          // Open preview dialog for newly uploaded file
          setPreviewDialog({
            open: true,
            spreadsheetId: uploadedSpreadsheet.id,
            fileName: file.name,
            fileContent,
          })
          
        } catch (error) {
          console.error('Upload error:', error)
          toast({
            title: 'Upload failed',
            description: 'Failed to upload contact spreadsheet',
            variant: 'destructive',
          })
        }
      }
      
      reader.readAsText(file)
      
    } catch (error) {
      console.error('File read error:', error)
      toast({
        title: 'Error',
        description: 'Failed to read file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) return

    try {
      if (selectedFiles.length === 1) {
        const blob = await contactsApi.downloadSpreadsheet(selectedFiles[0])
        const file = files.find(f => f.id === selectedFiles[0])
        if (file) {
          downloadBlob(blob, file.originalFileName)
        }
      } else {
        const blob = await contactsApi.downloadMultipleSpreadsheets(selectedFiles)
        downloadBlob(blob, `contacts-${selectedFiles.length}-files.zip`)
      }
      
      toast({
        title: 'Success',
        description: 'Files downloaded successfully',
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download failed',
        description: 'Failed to download files',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return

    const fileCount = selectedFiles.length
    const fileText = fileCount === 1 ? 'file' : 'files'

    if (!confirm(`Are you sure you want to permanently delete ${fileCount} ${fileText}? This will also delete all contacts from these spreadsheets. This action cannot be undone.`)) {
      return
    }

    try {
      await contactsApi.deleteMultipleSpreadsheets(selectedFiles)

      toast({
        title: 'Success',
        description: `Deleted ${fileCount} ${fileText} and their contacts`,
      })

      // Clear selection and reload data
      setSelectedFiles([])
      await loadSpreadsheets()
      await loadStats()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete files',
        variant: 'destructive',
      })
    }
  }

  const handleRetryConfiguration = async (file: ContactSpreadsheet) => {
    try {
      // Get the file content from the backend
      const spreadsheet = await contactsApi.getSpreadsheet(file.id)

      // Open the preview dialog with the file data
      setPreviewDialog({
        open: true,
        spreadsheetId: file.id,
        fileName: file.originalFileName,
        fileContent: spreadsheet.fileContent,
      })
    } catch (error) {
      console.error('Error getting spreadsheet:', error)
      toast({
        title: 'Error',
        description: 'Failed to load spreadsheet data',
        variant: 'destructive',
      })
    }
  }

  const handleViewDetails = (file: ContactSpreadsheet) => {
    setDetailsDialog({
      open: true,
      spreadsheet: file,
    })
  }

  const handleContactSort = (column: 'firstName' | 'lastName' | 'phone' | 'email' | 'groups') => {
    if (contactSortBy === column) {
      // Toggle sort order if clicking on same column
      setContactSortOrder(contactSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Change to new column, default to ascending
      setContactSortBy(column)
      setContactSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleSpreadsheetSort = (column: 'status') => {
    if (spreadsheetSortBy === column) {
      // Toggle sort order if clicking on same column
      setSpreadsheetSortOrder(spreadsheetSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // For status, default to pending first (asc)
      setSpreadsheetSortBy(column)
      setSpreadsheetSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const renderSpreadsheetSortIcon = (column: 'status') => {
    if (spreadsheetSortBy !== column) return null
    return spreadsheetSortOrder === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1" /> :
      <ChevronDown className="h-4 w-4 ml-1" />
  }

  const renderSortIcon = (column: 'firstName' | 'lastName' | 'phone' | 'email' | 'groups') => {
    if (contactSortBy !== column) return null
    return contactSortOrder === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1" /> :
      <ChevronDown className="h-4 w-4 ml-1" />
  }

  const isAllSelected = selectedFiles.length === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0
  const isSomeSelected = selectedFiles.length > 0
  const isAllContactsSelected = selectedContacts.length === filteredAndSortedContacts.length && filteredAndSortedContacts.length > 0
  const isSomeContactsSelected = selectedContacts.length > 0

  const getStatusDisplay = (status: string, file: ContactSpreadsheet) => {
    const statusConfig = {
      pending: { dot: 'bg-yellow-500', text: 'Pending' },
      processed: { dot: 'bg-green-500', text: 'Processed' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { dot: 'bg-gray-400', text: status }

    return (
      <div className='flex items-center gap-2'>
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className='text-sm w-16'>{config.text}</span>
        <div className='flex items-center'>
          {status === 'pending' && (
            <Button
              size='sm'
              variant='ghost'
              onClick={(e) => {
                e.stopPropagation()
                handleRetryConfiguration(file)
              }}
              className='gap-1 h-6 px-2'
              title='Retry configuration'
            >
              <RefreshCw className='h-3 w-3' />
            </Button>
          )}
          {status === 'processed' && (file.skippedCount || file.processingErrors?.length) && (
            <Button
              size='sm'
              variant='ghost'
              onClick={(e) => {
                e.stopPropagation()
                handleViewDetails(file)
              }}
              className='gap-1 h-6 px-2'
              title='View processing details'
            >
              <Eye className='h-3 w-3' />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full overflow-hidden'>
      {/* Sidebar */}
      <div className='w-64 border-r bg-background/50 p-4 flex flex-col h-full overflow-hidden'>
        <div className='space-y-2 flex-shrink-0'>
          <Button
            variant={selectedMode === 'spreadsheets' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => {
              setSelectedMode('spreadsheets')
              setCurrentPage(1)
              setSearchQuery('')
            }}
          >
            <FileSpreadsheet className='mr-2 h-4 w-4' />
            Contact groups ({totalFiles})
          </Button>
          <Button
            variant={selectedMode === 'all' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => {
              setSelectedMode('all')
              setCurrentPage(1)
              setSearchQuery('')
            }}
          >
            <Users className='mr-2 h-4 w-4' />
            All contacts ({totalContacts.toLocaleString()})
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className={selectedContact && selectedMode === 'all' ? 'flex-1 flex h-full overflow-hidden' : 'flex-1 flex flex-col h-full overflow-hidden'}>
        <div className='flex-1 flex flex-col h-full'>
        {/* Header */}
        <div className='border-b p-4 flex-shrink-0'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold'>
              {selectedMode === 'spreadsheets' && 'Contact groups'}
              {selectedMode === 'all' && 'All contacts'}
            </h2>
            <div className='relative w-80'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={selectedMode === 'spreadsheets' ? 'Search contact files...' : 'Search contacts...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
                className='pl-10'
              />
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              {selectedMode === 'spreadsheets' && (
                <>
                  <Button
                    className='gap-2'
                    onClick={handleUploadClick}
                    disabled={uploading}
                  >
                    <Upload className='h-4 w-4' />
                    {uploading ? 'Uploading...' : 'Upload contacts'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='.csv'
                    onChange={handleFileUpload}
                    className='hidden'
                  />
                  <div className='flex flex-col gap-1'>
                    <label className='text-xs text-muted-foreground'>Sort by:</label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='newest'>Newest</SelectItem>
                        <SelectItem value='oldest'>Oldest</SelectItem>
                        <SelectItem value='a-z'>A → Z</SelectItem>
                        <SelectItem value='z-a'>Z → A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {selectedMode === 'all' && (
                <Dialog open={createContactOpen} onOpenChange={setCreateContactOpen}>
                  <DialogTrigger asChild>
                    <Button className='gap-2'>
                      <Plus className='h-4 w-4' />
                      Create new contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
                    <DialogHeader>
                      <DialogTitle>Create New Contact</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {contactFields.map((field) => {
                          const value = createContactData[field.key]
                          const displayValue = field.type === 'number' && value === 0 ? '' : value

                          return (
                            <div key={field.key} className={field.key === 'propertyAddress' || field.key === 'mailingAddress' ? 'md:col-span-2' : ''}>
                              <Label htmlFor={field.key} className='text-sm font-medium'>
                                {field.label}{field.required && <span className='text-red-500'>*</span>}
                              </Label>
                              {field.key === 'propertyAddress' || field.key === 'mailingAddress' ? (
                                <Textarea
                                  id={field.key}
                                  value={displayValue || ''}
                                  onChange={(e) => {
                                    setCreateContactData(prev => ({ ...prev, [field.key]: e.target.value }))
                                  }}
                                  className='mt-1'
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                  rows={2}
                                />
                              ) : field.type === 'select' && field.key === 'dnc' ? (
                                <select
                                  id={field.key}
                                  value={value === null ? 'unknown' : value ? 'yes' : 'no'}
                                  onChange={(e) => {
                                    const newValue = e.target.value === 'unknown' ? null : e.target.value === 'yes'
                                    setCreateContactData(prev => ({ ...prev, [field.key]: newValue }))
                                  }}
                                  className='mt-1 rounded border border-input px-3 py-2 text-sm w-full'
                                >
                                  <option value="unknown">Unknown</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              ) : (
                                <Input
                                  id={field.key}
                                  type={field.type}
                                  value={displayValue || ''}
                                  onChange={(e) => {
                                    const newValue = field.type === 'number'
                                      ? (e.target.value ? parseFloat(e.target.value) : 0)
                                      : e.target.value
                                    setCreateContactData(prev => ({ ...prev, [field.key]: newValue }))
                                  }}
                                  className='mt-1'
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                  required={field.required}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setCreateContactOpen(false)}
                        disabled={createContactMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateContact}
                        disabled={createContactMutation.isPending || !createContactData.phone.trim()}
                      >
                        {createContactMutation.isPending ? 'Creating...' : 'Create Contact'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className='flex items-center gap-4'>
              {selectedMode === 'spreadsheets' && isSomeSelected && (
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>{selectedFiles.length} selected</Badge>
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-2'
                    onClick={handleDownloadSelected}
                  >
                    <Download className='h-4 w-4' />
                    Download
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-2'
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className='h-4 w-4' />
                    Delete
                  </Button>
                </div>
              )}
              {selectedMode === 'all' && isSomeContactsSelected && (
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>{selectedContacts.length} selected</Badge>
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-2'
                    onClick={handleDeleteSelectedContacts}
                    disabled={deleteContactsMutation.isPending}
                  >
                    <Trash2 className='h-4 w-4' />
                    {deleteContactsMutation.isPending ? 'Deleting...' : 'Delete contact(s)'}
                  </Button>
                </div>
              )}
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>Display:</span>
                <Select value={displayCount.toString()} onValueChange={(value) => setDisplayCount(parseInt(value))}>
                  <SelectTrigger className='w-20'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='25'>25</SelectItem>
                    <SelectItem value='100'>100</SelectItem>
                    <SelectItem value='250'>250</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Table or Empty State */}
        <div className='flex-1 overflow-y-auto'>
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-muted-foreground'>Loading...</div>
            </div>
          ) : selectedMode === 'spreadsheets' ? (
            totalFiles === 0 ? (
              <div className='flex flex-col items-center justify-center h-full py-16'>
                <FileSpreadsheet className='h-16 w-16 text-muted-foreground/50 mb-4' />
                <h3 className='text-lg font-semibold text-muted-foreground mb-2'>No contact spreadsheets</h3>
                <p className='text-sm text-muted-foreground mb-6 text-center max-w-md'>
                  Upload your first CSV file to get started managing your contacts.
                </p>
                <Button className='gap-2' onClick={handleUploadClick}>
                  <Upload className='h-4 w-4' />
                  Upload contacts
                </Button>
              </div>
            ) : (
              <table className='w-full'>
                <thead className='border-b bg-muted/50'>
                  <tr>
                    <th className='w-12 p-4'>
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className='text-left p-4 font-medium'>Group name</th>
                    <th
                      className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                      onClick={() => handleSpreadsheetSort('status')}
                    >
                      <div className='flex items-center'>
                        Status
                        {renderSpreadsheetSortIcon('status')}
                      </div>
                    </th>
                    <th className='text-left p-4 font-medium'>CSV rows</th>
                    <th className='text-left p-4 font-medium'>Contacts</th>
                    <th className='text-left p-4 font-medium'>Non-DNC</th>
                    <th className='text-left p-4 font-medium'>DNC</th>
                    <th className='text-left p-4 font-medium'>Date created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedFiles.map((file) => (
                    <tr key={file.id} className='border-b hover:bg-muted/25'>
                      <td className='p-4'>
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                        />
                      </td>
                      <td className='p-4'>
                        <div className='flex items-center gap-2'>
                          <FileSpreadsheet className='h-4 w-4 text-muted-foreground' />
                          <div>
                            <div className='font-medium'>{file.originalFileName}</div>
                          </div>
                        </div>
                      </td>
                      <td className='p-4'>
                        {getStatusDisplay(file.status, file)}
                      </td>
                      <td className='p-4 text-muted-foreground'>
                        {file.contactCount.toLocaleString()}
                      </td>
                      <td className='p-4 text-muted-foreground'>
                        {file.status === 'pending' ? '-' : (file.validContactsCount?.toLocaleString() ?? '-')}
                      </td>
                      <td className='p-4 text-muted-foreground'>
                        {file.status === 'pending' ? '-' : (file.nonDncCount?.toLocaleString() ?? '-')}
                      </td>
                      <td className='p-4 text-muted-foreground'>
                        {file.status === 'pending' ? '-' : (file.dncCount?.toLocaleString() ?? '-')}
                      </td>
                      <td className='p-4 text-muted-foreground'>
                        {file.uploadDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            // All contacts view
            totalContacts === 0 ? (
              <div className='flex flex-col items-center justify-center h-full py-16'>
                <Users className='h-16 w-16 text-muted-foreground/50 mb-4' />
                <h3 className='text-lg font-semibold text-muted-foreground mb-2'>No contacts</h3>
                <p className='text-sm text-muted-foreground mb-6 text-center max-w-md'>
                  Upload and process CSV files to see individual contacts here.
                </p>
              </div>
            ) : (
              <table className='w-full'>
                <thead className='border-b bg-muted/50'>
                  <tr>
                    <th className='w-12 p-4'>
                      <Checkbox
                        checked={isAllContactsSelected}
                        onCheckedChange={handleSelectAllContacts}
                      />
                    </th>
                    <th
                      className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                      onClick={() => handleContactSort('firstName')}
                    >
                      <div className='flex items-center'>
                        First name
                        {renderSortIcon('firstName')}
                      </div>
                    </th>
                    <th 
                      className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                      onClick={() => handleContactSort('lastName')}
                    >
                      <div className='flex items-center'>
                        Last name
                        {renderSortIcon('lastName')}
                      </div>
                    </th>
                    <th 
                      className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                      onClick={() => handleContactSort('phone')}
                    >
                      <div className='flex items-center'>
                        Phone
                        {renderSortIcon('phone')}
                      </div>
                    </th>
                    <th
                      className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                      onClick={() => handleContactSort('email')}
                    >
                      <div className='flex items-center'>
                        Email
                        {renderSortIcon('email')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={cn(
                        'border-b hover:bg-muted/25 transition-colors',
                        selectedContact?.id === contact.id && 'bg-primary/10 border-l-4 border-l-primary'
                      )}
                    >
                      <td className='p-4'>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td
                        className='p-4 text-muted-foreground cursor-pointer'
                        onClick={() => setSelectedContact(contact)}
                      >
                        {contact.firstName}
                      </td>
                      <td
                        className='p-4 text-muted-foreground cursor-pointer'
                        onClick={() => setSelectedContact(contact)}
                      >
                        {contact.lastName}
                      </td>
                      <td
                        className='p-4 text-muted-foreground cursor-pointer'
                        onClick={() => setSelectedContact(contact)}
                      >
                        {contact.phone}
                      </td>
                      <td
                        className='p-4 text-muted-foreground cursor-pointer'
                        onClick={() => setSelectedContact(contact)}
                      >
                        {contact.email || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Pagination - Always at bottom */}
        <div className='border-t p-4 mt-auto flex-shrink-0'>
          {((selectedMode === 'spreadsheets' && totalFiles > 0) || (selectedMode === 'all' && totalContacts > 0)) ? (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                {selectedMode === 'spreadsheets' ? (
                  `Showing 1-${Math.min(displayCount, totalFiles)} of ${totalFiles} files`
                ) : (
                  `Showing 1-${Math.min(displayCount, contacts.length)} of ${filteredContactsTotal} contacts`
                )}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                  Previous
                </Button>
                <span className='text-sm text-muted-foreground'>
                  Page {currentPage} of {Math.ceil((selectedMode === 'spreadsheets' ? totalFiles : filteredContactsTotal) / displayCount) || 1}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.min(Math.ceil((selectedMode === 'spreadsheets' ? totalFiles : filteredContactsTotal) / displayCount), currentPage + 1))}
                  disabled={currentPage >= Math.ceil((selectedMode === 'spreadsheets' ? totalFiles : filteredContactsTotal) / displayCount)}
                >
                  Next
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ) : (
            <div className='h-0'></div>
          )}
        </div>
        </div>

        {/* Contact sidebar */}
        {selectedContact && selectedMode === 'all' && (
          <div className="w-96 flex-shrink-0 h-full overflow-hidden">
            <ContactSidebar
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
            />
          </div>
        )}
      </div>

      <CsvPreviewDialog
          open={previewDialog.open}
          onOpenChange={(open) => setPreviewDialog(prev => ({ ...prev, open }))}
          spreadsheetId={previewDialog.spreadsheetId}
          fileName={previewDialog.fileName}
          fileContent={previewDialog.fileContent}
          onProcessComplete={async () => {
            await loadSpreadsheets()
            await loadStats()
          }}
        />

      <ProcessingDetailsDialog
          open={detailsDialog.open}
          onOpenChange={(open) => setDetailsDialog(prev => ({ ...prev, open }))}
          spreadsheet={detailsDialog.spreadsheet}
        />
    </div>
  )
}
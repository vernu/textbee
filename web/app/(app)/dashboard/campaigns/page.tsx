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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Upload,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  Megaphone,
  ChevronUp,
  ChevronDown,
  Edit,
  Save,
  X,
  MessageSquare,
  Plus,
  Check,
  Calendar,
  Settings,
  Eye,
  FileText,
  GripVertical,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { contactsApi, ContactSpreadsheet } from '@/lib/api/contacts'
import { campaignsApi, MessageTemplateGroup, MessageTemplate, ReorderTemplateGroupsDto } from '@/lib/api/campaigns'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'


interface Campaign {
  _id: string
  id: string
  name: string
  status: 'active' | 'draft' | 'inactive' | 'completed'
  contacts: number
  groups: number
  dateCreated: string
  lastSent?: string
  description?: string
}

function TemplateSelectionItem({ template, isSelected, onToggle }: { template: any, isSelected: boolean, onToggle: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className='border border-muted rounded p-2'>
      <div className='flex items-start space-x-2'>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
        />
        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between'>
            <span className='font-medium text-sm truncate pr-2'>{template.name}</span>
            <div className='flex items-center space-x-2 shrink-0'>
              <Badge variant='secondary' className='text-xs'>
                {template.content.length} chars
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                className='p-1 h-6 w-6'
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className='h-3 w-3' />
              </Button>
            </div>
          </div>
          <div
            className={`text-xs text-muted-foreground mt-1 transition-all duration-200 ${
              isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
            }`}
            style={{ maxHeight: isExpanded ? '200px' : '20px', overflow: isExpanded ? 'auto' : 'hidden' }}
          >
            {template.content}
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateItem({ template, onRemove }: { template: any, onRemove: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTextClipped, setIsTextClipped] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkTextClipping = () => {
      if (textRef.current && !isExpanded) {
        const element = textRef.current
        const isClipped = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth
        setIsTextClipped(isClipped)
      }
    }

    checkTextClipping()

    // Check again when the window resizes
    window.addEventListener('resize', checkTextClipping)
    return () => window.removeEventListener('resize', checkTextClipping)
  }, [template.content, isExpanded])

  return (
    <div className='bg-gray-200 rounded p-2 border'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          <div className='text-xs font-medium mb-1'>{template.name}</div>
          <div className='flex items-start gap-1'>
            <div
              ref={textRef}
              className={`text-xs text-muted-foreground transition-all duration-200 flex-1 ${
                isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
              }`}
              style={{ maxHeight: isExpanded ? '200px' : '20px', overflow: isExpanded ? 'visible' : 'hidden' }}
            >
              {template.content}
            </div>
            {(isTextClipped || isExpanded) && (
              <Button
                variant='ghost'
                size='sm'
                className='p-0 h-4 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0'
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='p-0.5 h-5 w-5 text-muted-foreground hover:text-foreground'
          onClick={onRemove}
        >
          <X className='h-3 w-3' />
        </Button>
      </div>
    </div>
  )
}

function getVariables(content: string): string[] {
  const regex = /{[^}]+}/g
  const matches = content.match(regex)
  if (!matches) {
    return []
  }
  return [...new Set(matches)]
}

export default function CampaignsPage() {
  const [selectedMode, setSelectedMode] = useState<'campaigns' | 'active' | 'draft' | 'inactive' | 'completed'>('campaigns')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayCount, setDisplayCount] = useState(25)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest')
  const [campaignSortBy, setCampaignSortBy] = useState<'name' | 'status' | 'contacts' | 'groups' | 'dateCreated' | 'lastSent'>('dateCreated')
  const [campaignSortOrder, setCampaignSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false)
  const [createCampaignData, setCreateCampaignData] = useState({
    name: '',
    description: '',
    status: 'draft' as 'active' | 'draft' | 'inactive' | 'completed',
    selectedContacts: [] as string[],
    selectedTemplates: [] as string[], // Changed from messageTemplateGroups to selectedTemplates
    sendDevices: [] as string[],
    scheduleType: 'now' as 'now' | 'later' | 'windows' | 'weekday',
    scheduledDate: '',
    scheduledTime: '',
    sendingWindows: [] as Array<{ startDate: string; startTime: string; endDate: string; endTime: string }>,
    weekdayWindows: {
      monday: [] as Array<{ startTime: string; endTime: string }>,
      tuesday: [] as Array<{ startTime: string; endTime: string }>,
      wednesday: [] as Array<{ startTime: string; endTime: string }>,
      thursday: [] as Array<{ startTime: string; endTime: string }>,
      friday: [] as Array<{ startTime: string; endTime: string }>,
      saturday: [] as Array<{ startTime: string; endTime: string }>,
      sunday: [] as Array<{ startTime: string; endTime: string }>
    },
    weekdayEnabled: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
  })
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false)
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [createTemplateGroupOpen, setCreateTemplateGroupOpen] = useState(false)
  const [newTemplateGroup, setNewTemplateGroup] = useState({
    name: '',
    description: ''
  })
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: ''
  })
  const [editTemplateOpen, setEditTemplateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string
    groupId: string
    name: string
    content: string
  } | null>(null)
  const [templateSelectionOpen, setTemplateSelectionOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null)
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)
  const [uniqueContactCount, setUniqueContactCount] = useState<number>(0)

  // Validation functions for each stage
  const validateDetailsStage = () => {
    return createCampaignData.name.trim() !== '' && createCampaignData.selectedContacts.length > 0
  }

  const validateConfigureStage = () => {
    const hasTemplates = createCampaignData.selectedTemplates.length > 0
    const hasDevices = createCampaignData.sendDevices.length > 0
    const hasValidSchedule = createCampaignData.scheduleType === 'now' ||
      (createCampaignData.scheduleType === 'later' &&
       createCampaignData.scheduledDate &&
       createCampaignData.scheduledTime) ||
      (createCampaignData.scheduleType === 'windows' &&
       createCampaignData.sendingWindows.length > 0) ||
      (createCampaignData.scheduleType === 'weekday' &&
       Object.entries(createCampaignData.weekdayWindows).some(([day, dayWindows]) =>
         createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && dayWindows.length > 0))

    return hasTemplates && hasDevices && hasValidSchedule
  }

  const canNavigateToTab = (targetTab: string) => {
    if (targetTab === 'details') return true
    if (targetTab === 'configure') return validateDetailsStage()
    if (targetTab === 'preview') return validateDetailsStage() && validateConfigureStage()
    return false
  }

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch processed contact spreadsheets from API
  const { data: contactSpreadsheetsData } = useQuery({
    queryKey: ['contact-spreadsheets-processed'],
    queryFn: async () => {
      const response = await contactsApi.getSpreadsheets({
        limit: 1000 // Get all spreadsheets
      })
      // Filter only processed spreadsheets
      return response.data.filter(spreadsheet => spreadsheet.status === 'processed')
    }
  })

  // Fetch registered devices from API
  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  // Fetch template groups from API
  const { data: templateGroupsData, refetch: refetchTemplateGroups } = useQuery({
    queryKey: ['template-groups'],
    queryFn: () => campaignsApi.getTemplateGroups(),
  })

  const templateGroups = templateGroupsData || []

  // Mutations for template groups
  const createTemplateGroupMutation = useMutation({
    mutationFn: campaignsApi.createTemplateGroup,
    onSuccess: () => {
      refetchTemplateGroups()
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
    },
  })

  const reorderTemplateGroupsMutation = useMutation({
    mutationFn: async ({ sourceIndex, destinationIndex }: { sourceIndex: number; destinationIndex: number }) => {
      // Create a copy of the current template groups array
      const reorderedGroups = [...templateGroups]

      // Remove the item from source index and insert at destination index
      const [movedGroup] = reorderedGroups.splice(sourceIndex, 1)
      reorderedGroups.splice(destinationIndex, 0, movedGroup)

      // Extract the new order of IDs
      const templateGroupIds = reorderedGroups.map(group => group._id)

      // Call the API to persist the new order
      return await campaignsApi.reorderTemplateGroups({ templateGroupIds })
    },
    onMutate: async ({ sourceIndex, destinationIndex }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['template-groups'] })

      // Snapshot the previous value
      const previousTemplateGroups = queryClient.getQueryData(['template-groups'])

      // Optimistically update the cache
      queryClient.setQueryData(['template-groups'], (old: MessageTemplateGroup[] | undefined) => {
        if (!old) return old

        const reorderedGroups = [...old]
        const [movedGroup] = reorderedGroups.splice(sourceIndex, 1)
        reorderedGroups.splice(destinationIndex, 0, movedGroup)

        return reorderedGroups
      })

      // Return a context object with the snapshotted value
      return { previousTemplateGroups }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTemplateGroups) {
        queryClient.setQueryData(['template-groups'], context.previousTemplateGroups)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
    },
  })

  const updateTemplateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      campaignsApi.updateTemplateGroup(id, data),
    onSuccess: () => {
      refetchTemplateGroups()
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
    },
  })

  const deleteTemplateGroupMutation = useMutation({
    mutationFn: campaignsApi.deleteTemplateGroup,
    onSuccess: () => {
      setSelectedTemplateGroup(null)
      refetchTemplateGroups()
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
      toast({
        title: "Template group deleted",
        description: "Template group deleted successfully. Links to contacts have been removed."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template group",
        description: error.response?.data?.message || "An error occurred while deleting the template group.",
        variant: "destructive"
      })
    },
  })

  // Mutations for templates
  const createTemplateMutation = useMutation({
    mutationFn: campaignsApi.createTemplate,
    onSuccess: () => {
      refetchTemplateGroups()
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
    },
  })

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      campaignsApi.updateTemplate(id, data),
    onSuccess: () => {
      refetchTemplateGroups()
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: campaignsApi.deleteTemplate,
    onSuccess: () => {
      refetchTemplateGroups()
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
      toast({
        title: "Template deleted",
        description: "Template has been deleted successfully."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template",
        description: error.response?.data?.message || "An error occurred while deleting the template.",
        variant: "destructive"
      })
    },
  })

  // Campaigns will be fetched from API
  useEffect(() => {
    // TODO: Replace with actual API call
    setCampaigns([])
    setLoading(false)
  }, [])

  // Auto-expand groups when templates are selected
  useEffect(() => {
    if (createCampaignData.selectedTemplates.length > 0) {
      const groupsWithSelectedTemplates = new Set<string>()

      createCampaignData.selectedTemplates.forEach(templateId => {
        for (const group of templateGroups) {
          const template = group.templates.find(t => t._id === templateId)
          if (template) {
            groupsWithSelectedTemplates.add(`selected-${group._id}`)
            break
          }
        }
      })

      setExpandedGroups(groupsWithSelectedTemplates)
    }
  }, [createCampaignData.selectedTemplates, templateGroups])

  // Fetch unique contact count when selected contacts change
  useEffect(() => {
    const fetchUniqueContactCount = async () => {
      if (createCampaignData.selectedContacts.length === 0) {
        setUniqueContactCount(0)
        return
      }

      try {
        const result = await contactsApi.getUniqueContactCount(createCampaignData.selectedContacts)
        setUniqueContactCount(result.uniqueContactCount)
      } catch (error) {
        console.error('Failed to fetch unique contact count:', error)
        setUniqueContactCount(0)
      }
    }

    fetchUniqueContactCount()
  }, [createCampaignData.selectedContacts])

  // Filter and sort campaigns based on selected mode
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns

    if (selectedMode !== 'campaigns') {
      filtered = filtered.filter(campaign => campaign.status === selectedMode)
    }

    if (searchQuery) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort campaigns
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (campaignSortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'contacts':
          aValue = a.contacts
          bValue = b.contacts
          break
        case 'groups':
          aValue = a.groups
          bValue = b.groups
          break
        case 'dateCreated':
          aValue = new Date(a.dateCreated).getTime()
          bValue = new Date(b.dateCreated).getTime()
          break
        case 'lastSent':
          aValue = a.lastSent ? new Date(a.lastSent).getTime() : 0
          bValue = b.lastSent ? new Date(b.lastSent).getTime() : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return campaignSortOrder === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return campaignSortOrder === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [campaigns, selectedMode, searchQuery, campaignSortBy, campaignSortOrder])

  const [totalCampaigns, totalActive, totalDraft, totalInactive, totalCompleted] = useMemo(() => {
    const total = campaigns.length
    const active = campaigns.filter(c => c.status === 'active').length
    const draft = campaigns.filter(c => c.status === 'draft').length
    const inactive = campaigns.filter(c => c.status === 'inactive').length
    const completed = campaigns.filter(c => c.status === 'completed').length

    return [total, active, draft, inactive, completed]
  }, [campaigns])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(filteredAndSortedCampaigns.map(campaign => campaign.id))
    } else {
      setSelectedCampaigns([])
    }
  }

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns([...selectedCampaigns, campaignId])
    } else {
      setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaignId))
    }
  }

  const handleCreateCampaign = () => {
    if (!createCampaignData.name.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a name for the campaign.",
        variant: "destructive"
      })
      return
    }

    if (createCampaignData.selectedContacts.length === 0) {
      toast({
        title: "Contacts required",
        description: "Please select at least one contact spreadsheet.",
        variant: "destructive"
      })
      return
    }

    const totalContacts = createCampaignData.selectedContacts.reduce((sum, contactId) => {
      const contact = contactSpreadsheetsData?.find(c => c.id === contactId)
      return sum + (contact?.validContactsCount || contact?.contactCount || 0)
    }, 0)

    const newCampaign: Campaign = {
      _id: Date.now().toString(),
      id: Date.now().toString(),
      name: createCampaignData.name,
      status: createCampaignData.status,
      contacts: totalContacts,
      groups: createCampaignData.selectedContacts.length,
      dateCreated: new Date().toISOString(),
      description: createCampaignData.description,
    }

    setCampaigns([newCampaign, ...campaigns])
    setCreateCampaignOpen(false)
    setCreateCampaignData({
      name: '',
      description: '',
      status: 'draft',
      selectedContacts: [],
      selectedTemplates: [],
      sendDevices: [],
      scheduleType: 'now',
      scheduledDate: '',
      scheduledTime: '',
      sendingWindows: [],
      weekdayWindows: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      },
      weekdayEnabled: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
    })
    setActiveTab('details')

    toast({
      title: "Campaign created",
      description: "New campaign has been created successfully."
    })
  }

  const handleDeleteSelectedCampaigns = async () => {
    if (selectedCampaigns.length === 0) return

    const campaignCount = selectedCampaigns.length
    const campaignText = campaignCount === 1 ? 'campaign' : 'campaigns'

    if (!confirm(`Are you sure you want to permanently delete ${campaignCount} ${campaignText}? This action cannot be undone.`)) {
      return
    }

    setCampaigns(campaigns.filter(campaign => !selectedCampaigns.includes(campaign.id)))
    setSelectedCampaigns([])

    toast({
      title: "Success",
      description: `Deleted ${campaignCount} ${campaignText} successfully`
    })
  }

  const handleCreateTemplateGroup = async () => {
    if (!newTemplateGroup.name.trim()) {
      toast({
        title: "Template group name required",
        description: "Please enter a name for the template group.",
        variant: "destructive"
      })
      return
    }

    try {
      await createTemplateGroupMutation.mutateAsync({
        name: newTemplateGroup.name,
        description: newTemplateGroup.description || undefined,
      })

      setNewTemplateGroup({ name: '', description: '' })
      setCreateTemplateGroupOpen(false)

      toast({
        title: "Template group created",
        description: "New template group has been created successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error creating template group",
        description: error.response?.data?.message || "An error occurred while creating the template group.",
        variant: "destructive"
      })
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Template fields required",
        description: "Please enter both name and content for the template.",
        variant: "destructive"
      })
      return
    }

    if (!selectedTemplateGroup) {
      toast({
        title: "Select template group",
        description: "Please select a template group first.",
        variant: "destructive"
      })
      return
    }

    try {
      await createTemplateMutation.mutateAsync({
        groupId: selectedTemplateGroup,
        name: newTemplate.name,
        content: newTemplate.content,
      })

      setNewTemplate({ name: '', content: '' })
      setCreateTemplateOpen(false)

      toast({
        title: "Template created",
        description: "New template has been created successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error creating template",
        description: error.response?.data?.message || "An error occurred while creating the template.",
        variant: "destructive"
      })
    }
  }

  const handleEditTemplate = (template: any, groupId: string) => {
    setEditingTemplate({
      id: template._id,
      groupId: groupId,
      name: template.name,
      content: template.content
    })
    setEditTemplateOpen(true)
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    if (!editingTemplate.name.trim() || !editingTemplate.content.trim()) {
      toast({
        title: "Template fields required",
        description: "Please enter both name and content for the template.",
        variant: "destructive"
      })
      return
    }

    try {
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        data: {
          name: editingTemplate.name,
          content: editingTemplate.content,
        },
      })

      setEditingTemplate(null)
      setEditTemplateOpen(false)

      toast({
        title: "Template updated",
        description: "Template has been updated successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error updating template",
        description: error.response?.data?.message || "An error occurred while updating the template.",
        variant: "destructive"
      })
    }
  }

  const handleCampaignSort = (column: 'name' | 'status' | 'contacts' | 'groups' | 'dateCreated' | 'lastSent') => {
    if (campaignSortBy === column) {
      setCampaignSortOrder(campaignSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setCampaignSortBy(column)
      setCampaignSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const renderSortIcon = (column: 'name' | 'status' | 'contacts' | 'groups' | 'dateCreated' | 'lastSent') => {
    if (campaignSortBy !== column) return null
    return campaignSortOrder === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1" /> :
      <ChevronDown className="h-4 w-4 ml-1" />
  }

  const isAllSelected = selectedCampaigns.length === filteredAndSortedCampaigns.length && filteredAndSortedCampaigns.length > 0
  const isSomeSelected = selectedCampaigns.length > 0

  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      active: { dot: 'bg-green-500', text: 'Active' },
      completed: { dot: 'bg-blue-500', text: 'Completed' },
      draft: { dot: 'bg-gray-400', text: 'Draft' },
      inactive: { dot: 'bg-red-500', text: 'Inactive' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { dot: 'bg-gray-400', text: status }

    return (
      <div className='flex items-center gap-2'>
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className='text-sm'>{config.text}</span>
      </div>
    )
  }

  return (
    <div className='flex h-full overflow-hidden'>
      {/* Sidebar */}
      <div className='w-64 border-r bg-background/50 p-4 flex flex-col h-full overflow-hidden'>
        <div className='space-y-2 flex-shrink-0'>
          <Button
            variant={selectedMode === 'campaigns' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => {
              setSelectedMode('campaigns')
              setCurrentPage(1)
              setSearchQuery('')
            }}
          >
            <Megaphone className='mr-2 h-4 w-4' />
            Campaigns ({totalCampaigns})
          </Button>
          <Button
            variant={selectedMode === 'active' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => {
              setSelectedMode('active')
              setCurrentPage(1)
              setSearchQuery('')
            }}
          >
            <Users className='mr-2 h-4 w-4' />
            Active campaigns ({totalActive})
          </Button>
          <Button
            variant={selectedMode === 'draft' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => {
              setSelectedMode('draft')
              setCurrentPage(1)
              setSearchQuery('')
            }}
          >
            <Edit className='mr-2 h-4 w-4' />
            Draft campaigns ({totalDraft})
          </Button>
          <Button
            variant={selectedMode === 'inactive' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => {
              setSelectedMode('inactive')
              setCurrentPage(1)
              setSearchQuery('')
            }}
          >
            <X className='mr-2 h-4 w-4' />
            Inactive campaigns ({totalInactive})
          </Button>
          <Button
            variant={selectedMode === 'completed' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => {
              setSelectedMode('completed')
              setCurrentPage(1)
              setSearchQuery('')
            }}
          >
            <Check className='mr-2 h-4 w-4' />
            Completed campaigns ({totalCompleted})
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className='flex-1 flex flex-col h-full overflow-hidden'>
        {/* Header */}
        <div className='border-b p-4 flex-shrink-0'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold'>
              {selectedMode === 'campaigns' && 'Campaigns'}
              {selectedMode === 'active' && 'Active campaigns'}
              {selectedMode === 'draft' && 'Draft campaigns'}
              {selectedMode === 'inactive' && 'Inactive campaigns'}
              {selectedMode === 'completed' && 'Completed campaigns'}
            </h2>
            <div className='relative w-80'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search campaigns...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
                <DialogTrigger asChild>
                  <Button className='gap-2'>
                    <Plus className='h-4 w-4' />
                    Create new campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className='w-[90vw] max-w-6xl h-[90vh] overflow-hidden flex flex-col'>
                  <DialogHeader className='flex-shrink-0 border-b p-4 pb-3'>
                    <DialogTitle>Create New Campaign</DialogTitle>
                  </DialogHeader>
                  <div className='flex-1 overflow-hidden min-h-0'>
                    <Tabs value={activeTab} onValueChange={(value) => {
                      if (canNavigateToTab(value)) {
                        setActiveTab(value)
                      } else {
                        if (value === 'configure' && !validateDetailsStage()) {
                          toast({
                            title: "Complete required fields",
                            description: "Please fill in campaign name and select contacts before proceeding.",
                            variant: "destructive"
                          })
                        } else if (value === 'preview' && !validateConfigureStage()) {
                          toast({
                            title: "Complete SMS configuration",
                            description: "Please select template groups, devices, and schedule before previewing.",
                            variant: "destructive"
                          })
                        }
                      }
                    }} className='h-full flex flex-col'>
                      <TabsList className='h-[50px] w-full grid grid-cols-3 flex-shrink-0'>
                        <TabsTrigger value='details' className='flex items-center justify-center gap-2 h-full'>
                          <FileText className='h-4 w-4' />
                          Details
                        </TabsTrigger>
                        <TabsTrigger
                          value='configure'
                          disabled={!canNavigateToTab('configure')}
                          className='flex items-center justify-center gap-2 h-full disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <Settings className='h-4 w-4' />
                          Configure SMS
                        </TabsTrigger>
                        <TabsTrigger
                          value='preview'
                          disabled={!canNavigateToTab('preview')}
                          className='flex items-center justify-center gap-2 h-full disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <Eye className='h-4 w-4' />
                          Preview
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value='details' className='flex-1 overflow-y-auto p-4 min-h-0'>
                        <div className='space-y-6 max-w-[500px]'>
                          <div className='space-y-2'>
                            <Label htmlFor='name' className='text-sm font-medium'>
                              Campaign Name<span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              id='name'
                              value={createCampaignData.name}
                              onChange={(e) => {
                                setCreateCampaignData(prev => ({ ...prev, name: e.target.value }))
                              }}
                              placeholder='Enter campaign name'
                              className='w-full'
                            />
                          </div>

                          <div className='space-y-2'>
                            <Label className='text-sm font-medium'>
                              Selected Contacts<span className='text-red-500'>*</span>
                            </Label>
                            <Select>
                              <SelectTrigger className='w-full'>
                                <SelectValue
                                  placeholder={createCampaignData.selectedContacts.length > 0
                                    ? `${createCampaignData.selectedContacts.length} group(s) selected (${uniqueContactCount.toLocaleString()} unique contacts)`
                                    : 'Select contact groups'}
                                />
                              </SelectTrigger>
                              <SelectContent className='max-h-60 overflow-y-auto'>
                                {contactSpreadsheetsData?.length === 0 ? (
                                  <div className='px-2 py-4 text-center text-sm text-muted-foreground'>
                                    No processed contact spreadsheets available.
                                    <br />
                                    Process spreadsheets in the Contacts page first.
                                  </div>
                                ) : (
                                  contactSpreadsheetsData?.map(contact => (
                                    <div key={contact.id} className='flex items-center space-x-2 px-2 py-2 cursor-pointer hover:bg-muted/50'
                                         onClick={(e) => {
                                           e.preventDefault()
                                           const isSelected = createCampaignData.selectedContacts.includes(contact.id)
                                           if (isSelected) {
                                             setCreateCampaignData(prev => ({
                                               ...prev,
                                               selectedContacts: prev.selectedContacts.filter(id => id !== contact.id)
                                             }))
                                           } else {
                                             setCreateCampaignData(prev => ({
                                               ...prev,
                                               selectedContacts: [...prev.selectedContacts, contact.id]
                                             }))
                                           }
                                         }}>
                                      <Checkbox
                                        checked={createCampaignData.selectedContacts.includes(contact.id)}
                                        onChange={() => {}}
                                      />
                                      <div className='text-sm'>
                                        <div className='font-medium'>{contact.originalFileName}</div>
                                        <div className='text-xs text-muted-foreground'>
                                          {(contact.validContactsCount || contact.contactCount).toLocaleString()} valid contacts • Uploaded {new Date(contact.uploadDate).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor='description' className='text-sm font-medium'>
                              Description
                            </Label>
                            <Textarea
                              id='description'
                              value={createCampaignData.description}
                              onChange={(e) => {
                                setCreateCampaignData(prev => ({ ...prev, description: e.target.value }))
                              }}
                              placeholder='Enter campaign description (optional)'
                              rows={4}
                              className='w-full resize-none'
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value='configure' className='flex-1 overflow-hidden p-4 min-h-0'>
                        <div className='grid grid-cols-2 gap-6 h-full'>
                          {/* Left Column - Form Controls */}
                          <div className='space-y-4 overflow-y-auto max-h-full pr-4'>
                          <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <Label className='text-sm font-medium'>
                                Message Templates<span className='text-red-500'>*</span>
                              </Label>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setManageTemplatesOpen(true)}
                              >
                                Manage templates
                              </Button>
                            </div>
                            <Button
                              variant='outline'
                              className='w-full justify-start h-10'
                              onClick={() => setTemplateSelectionOpen(true)}
                            >
                              <MessageSquare className='mr-2 h-4 w-4' />
                              {createCampaignData.selectedTemplates.length > 0
                                ? `${createCampaignData.selectedTemplates.length} template(s) selected`
                                : 'Select message templates'}
                            </Button>
                          </div>

                          <div className='space-y-2'>
                            <Label className='text-sm font-medium'>
                              Send Devices<span className='text-red-500'>*</span>
                            </Label>
                            <div className='bg-muted/50 border rounded p-3 space-y-3 max-h-60 overflow-y-auto'>
                              {/* Select/Unselect All Toggle */}
                              <div className='flex items-center justify-between border-b border-border pb-2'>
                                <div className='flex items-center space-x-2'>
                                  <Checkbox
                                    checked={devicesData?.data?.filter(d => d.enabled).length > 0 &&
                                            devicesData?.data?.filter(d => d.enabled).every(d => createCampaignData.sendDevices.includes(d._id))}
                                    onCheckedChange={(checked) => {
                                      const allEnabledDeviceIds = devicesData?.data?.filter(d => d.enabled).map(d => d._id) || []
                                      if (checked) {
                                        setCreateCampaignData(prev => ({ ...prev, sendDevices: allEnabledDeviceIds }))
                                      } else {
                                        setCreateCampaignData(prev => ({ ...prev, sendDevices: [] }))
                                      }
                                    }}
                                  />
                                  <span className='text-sm font-medium'>Select/Unselect all enabled devices</span>
                                </div>
                              </div>

                              {/* Device List */}
                              {devicesData?.data?.length === 0 ? (
                                <div className='text-center text-sm text-muted-foreground py-4'>
                                  No devices registered.
                                  <br />
                                  Register devices in the Dashboard first.
                                </div>
                              ) : (
                                <div className='space-y-2'>
                                  {devicesData?.data?.map(device => (
                                    <div key={device._id} className='flex items-center justify-between p-2 rounded border bg-background'>
                                      <div className='flex items-center space-x-2'>
                                        <Checkbox
                                          checked={createCampaignData.sendDevices.includes(device._id)}
                                          disabled={!device.enabled}
                                          onCheckedChange={(checked) => {
                                            if (!device.enabled) return
                                            if (checked) {
                                              setCreateCampaignData(prev => ({
                                                ...prev,
                                                sendDevices: [...prev.sendDevices, device._id]
                                              }))
                                            } else {
                                              setCreateCampaignData(prev => ({
                                                ...prev,
                                                sendDevices: prev.sendDevices.filter(id => id !== device._id)
                                              }))
                                            }
                                          }}
                                          className={!device.enabled ? 'opacity-50' : ''}
                                        />
                                        <div className={`text-sm ${!device.enabled ? 'opacity-50' : ''}`}>
                                          <div className='flex items-center gap-2'>
                                            <span className='font-medium'>{device.brand} {device.model}</span>
                                            <Badge variant={device.enabled ? 'default' : 'secondary'} className='text-xs'>
                                              {device.enabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                          </div>
                                          <div className='text-xs text-muted-foreground mt-1'>
                                            <code className='bg-muted px-1 py-0.5 rounded text-xs'>
                                              {device._id}
                                            </code>
                                          </div>
                                        </div>
                                      </div>
                                      <div className={`text-sm text-muted-foreground text-right ${!device.enabled ? 'opacity-50' : ''}`}>
                                        <div>{device.max_hourly_send_rate || 60} per hour</div>
                                        <div>{device.daily_send_limit || 50} per day</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className='space-y-2'>
                            <Label className='text-sm font-medium'>Schedule Send</Label>
                            <div className='space-y-3'>
                              <div className='flex items-center space-x-2'>
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                    createCampaignData.scheduleType === 'now'
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground hover:border-primary'
                                  }`}
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'now' }))}
                                >
                                  {createCampaignData.scheduleType === 'now' && (
                                    <div className='w-2 h-2 rounded-full bg-white' />
                                  )}
                                </div>
                                <Label
                                  className='text-sm cursor-pointer'
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'now' }))}
                                >
                                  Start sending now
                                </Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                    createCampaignData.scheduleType === 'later'
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground hover:border-primary'
                                  }`}
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'later' }))}
                                >
                                  {createCampaignData.scheduleType === 'later' && (
                                    <div className='w-2 h-2 rounded-full bg-white' />
                                  )}
                                </div>
                                <Label
                                  className='text-sm cursor-pointer'
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'later' }))}
                                >
                                  Schedule start for later
                                </Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                    createCampaignData.scheduleType === 'weekday'
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground hover:border-primary'
                                  }`}
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'weekday' }))}
                                >
                                  {createCampaignData.scheduleType === 'weekday' && (
                                    <div className='w-2 h-2 rounded-full bg-white' />
                                  )}
                                </div>
                                <Label
                                  className='text-sm cursor-pointer'
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'weekday' }))}
                                >
                                  Define valid sending windows by weekday
                                </Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                    createCampaignData.scheduleType === 'windows'
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground hover:border-primary'
                                  }`}
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'windows' }))}
                                >
                                  {createCampaignData.scheduleType === 'windows' && (
                                    <div className='w-2 h-2 rounded-full bg-white' />
                                  )}
                                </div>
                                <Label
                                  className='text-sm cursor-pointer'
                                  onClick={() => setCreateCampaignData(prev => ({ ...prev, scheduleType: 'windows' }))}
                                >
                                  Define valid sending windows by slot
                                </Label>
                              </div>
                              {createCampaignData.scheduleType === 'later' && (
                                <div className='flex gap-2 ml-6'>
                                  <div className='space-y-1'>
                                    <Label className='text-xs text-muted-foreground'>
                                      Date<span className='text-red-500'>*</span>
                                    </Label>
                                    <Input
                                      type='date'
                                      value={createCampaignData.scheduledDate}
                                      onChange={(e) => {
                                        setCreateCampaignData(prev => ({ ...prev, scheduledDate: e.target.value }))
                                      }}
                                      className='w-[120px]'
                                    />
                                  </div>
                                  <div className='space-y-1'>
                                    <Label className='text-xs text-muted-foreground'>
                                      Time<span className='text-red-500'>*</span>
                                    </Label>
                                    <Input
                                      type='time'
                                      value={createCampaignData.scheduledTime}
                                      onChange={(e) => {
                                        setCreateCampaignData(prev => ({ ...prev, scheduledTime: e.target.value }))
                                      }}
                                      className='w-[120px]'
                                    />
                                  </div>
                                </div>
                              )}
                              {createCampaignData.scheduleType === 'windows' && (
                                <div className='ml-6 space-y-4 border-l-2 border-muted pl-4'>
                                  <div className='text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200'>
                                    <strong>Note:</strong> Define specific days and time windows when messages can be sent.
                                    Messages will only be sent during these windows.
                                  </div>

                                  <div className='flex items-center justify-between'>
                                    <Label className='text-xs text-muted-foreground font-medium'>
                                      Sending Windows<span className='text-red-500'>*</span>
                                    </Label>
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      className='gap-1 text-xs h-7'
                                      onClick={() => {
                                        setCreateCampaignData(prev => ({
                                          ...prev,
                                          sendingWindows: [...prev.sendingWindows, { startDate: '', startTime: '', endDate: '', endTime: '' }]
                                        }))
                                        // Auto-scroll to bottom after adding new window
                                        setTimeout(() => {
                                          const leftColumn = document.querySelector('[role="dialog"] .space-y-4.overflow-y-auto.max-h-full.pr-4')
                                          console.log('Found left column:', leftColumn) // Debug log
                                          if (leftColumn) {
                                            leftColumn.scrollTo({
                                              top: leftColumn.scrollHeight,
                                              behavior: 'smooth'
                                            })
                                          } else {
                                            console.log('Could not find scrollable container')
                                          }
                                        }, 100)
                                      }}
                                    >
                                      <Plus className='h-3 w-3' />
                                      Add window
                                    </Button>
                                  </div>

                                  {createCampaignData.sendingWindows.length === 0 ? (
                                    <div className='text-xs text-muted-foreground text-center py-4 bg-muted/50 rounded border-dashed border'>
                                      No sending windows defined. Click "Add window" to create one.
                                    </div>
                                  ) : (
                                    <div className='space-y-3'>
                                      {/* Headers */}
                                      <div className='flex items-center gap-2 px-2'>
                                        <div className='flex gap-2 flex-1'>
                                          <div className='w-32'>
                                            <Label className='text-xs text-muted-foreground font-medium'>Start date</Label>
                                          </div>
                                          <div className='w-24'>
                                            <Label className='text-xs text-muted-foreground font-medium'>Start time</Label>
                                          </div>
                                          <div className='w-32'>
                                            <Label className='text-xs text-muted-foreground font-medium'>End date</Label>
                                          </div>
                                          <div className='w-24'>
                                            <Label className='text-xs text-muted-foreground font-medium'>End time</Label>
                                          </div>
                                        </div>
                                        <div className='w-6'></div> {/* Spacer for remove button */}
                                      </div>

                                      {/* Window Items */}
                                      {createCampaignData.sendingWindows.map((window, index) => (
                                        <div key={index} className='flex items-center gap-2 p-2 bg-muted/30 rounded border'>
                                          <div className='flex gap-2 flex-1'>
                                            <Input
                                              type='date'
                                              value={window.startDate}
                                              onChange={(e) => {
                                                const newWindows = [...createCampaignData.sendingWindows]
                                                newWindows[index].startDate = e.target.value
                                                // Auto-update end date if it's empty
                                                if (!newWindows[index].endDate) {
                                                  newWindows[index].endDate = e.target.value
                                                }
                                                setCreateCampaignData(prev => ({ ...prev, sendingWindows: newWindows }))
                                              }}
                                              className='w-32 text-xs h-8'
                                            />
                                            <Input
                                              type='time'
                                              value={window.startTime}
                                              onChange={(e) => {
                                                const newWindows = [...createCampaignData.sendingWindows]
                                                newWindows[index].startTime = e.target.value
                                                setCreateCampaignData(prev => ({ ...prev, sendingWindows: newWindows }))
                                              }}
                                              className='w-24 text-xs h-8'
                                            />
                                            <Input
                                              type='date'
                                              value={window.endDate}
                                              onChange={(e) => {
                                                const newWindows = [...createCampaignData.sendingWindows]
                                                newWindows[index].endDate = e.target.value
                                                setCreateCampaignData(prev => ({ ...prev, sendingWindows: newWindows }))
                                              }}
                                              className='w-32 text-xs h-8'
                                            />
                                            <Input
                                              type='time'
                                              value={window.endTime}
                                              onChange={(e) => {
                                                const newWindows = [...createCampaignData.sendingWindows]
                                                newWindows[index].endTime = e.target.value
                                                setCreateCampaignData(prev => ({ ...prev, sendingWindows: newWindows }))
                                              }}
                                              className='w-24 text-xs h-8'
                                            />
                                          </div>
                                          <Button
                                            size='sm'
                                            variant='ghost'
                                            className='p-1 h-6 w-6 text-muted-foreground hover:text-destructive'
                                            onClick={() => {
                                              const newWindows = createCampaignData.sendingWindows.filter((_, i) => i !== index)
                                              setCreateCampaignData(prev => ({ ...prev, sendingWindows: newWindows }))
                                            }}
                                          >
                                            <X className='h-3 w-3' />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {createCampaignData.scheduleType === 'weekday' && (
                                <div className='ml-6 space-y-4 border-l-2 border-muted pl-4'>
                                  <div className='text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200'>
                                    <strong>Note:</strong> Define time windows for each day of the week when messages can be sent.
                                    Messages will only be sent during these time windows on the respective days.
                                  </div>

                                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                    <div key={day} className='space-y-2'>
                                      <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                          <Checkbox
                                            checked={createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled]}
                                            onCheckedChange={(checked) => {
                                              setCreateCampaignData(prev => ({
                                                ...prev,
                                                weekdayEnabled: {
                                                  ...prev.weekdayEnabled,
                                                  [day]: checked as boolean
                                                }
                                              }))
                                            }}
                                            className='h-4 w-4'
                                          />
                                          <Label className={`text-sm font-medium capitalize cursor-pointer ${
                                            createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled]
                                              ? 'text-foreground'
                                              : 'text-muted-foreground'
                                          }`}>
                                            {day}
                                          </Label>
                                        </div>
                                        <div className='flex gap-2'>
                                          {createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && (
                                            <>
                                              {createCampaignData.weekdayWindows[day as keyof typeof createCampaignData.weekdayWindows].length > 0 && (
                                                <Button
                                                  size='sm'
                                                  variant='outline'
                                                  className='gap-1 text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10'
                                                  onClick={() => {
                                                    setCreateCampaignData(prev => ({
                                                      ...prev,
                                                      weekdayWindows: {
                                                        ...prev.weekdayWindows,
                                                        [day]: []
                                                      }
                                                    }))
                                                  }}
                                                  title={`Clear all windows for ${day}`}
                                                >
                                                  <Trash2 className='h-3 w-3' />
                                                  Clear
                                                </Button>
                                              )}
                                              <Button
                                                size='sm'
                                                variant='outline'
                                                className='gap-1 text-xs h-7'
                                                onClick={() => {
                                                  setCreateCampaignData(prev => ({
                                                    ...prev,
                                                    weekdayWindows: {
                                                      ...prev.weekdayWindows,
                                                      [day]: [...prev.weekdayWindows[day as keyof typeof prev.weekdayWindows], { startTime: '', endTime: '' }]
                                                    }
                                                  }))
                                                }}
                                              >
                                                <Plus className='h-3 w-3' />
                                                Add window
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && (
                                        createCampaignData.weekdayWindows[day as keyof typeof createCampaignData.weekdayWindows].length === 0 ? (
                                          <div className='text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded border-dashed border ml-4'>
                                            No windows for {day}
                                          </div>
                                        ) : (
                                        <div className='ml-4 space-y-2'>
                                          {createCampaignData.weekdayWindows[day as keyof typeof createCampaignData.weekdayWindows].map((window, index) => (
                                            <div key={index} className='flex items-center gap-2 p-2 bg-muted/20 rounded border'>
                                              <div className='flex gap-2 flex-1'>
                                                <div className='flex flex-col'>
                                                  <Label className='text-xs text-muted-foreground mb-1'>Start time</Label>
                                                  <Input
                                                    type='time'
                                                    value={window.startTime}
                                                    onChange={(e) => {
                                                      const newWindows = { ...createCampaignData.weekdayWindows }
                                                      newWindows[day as keyof typeof newWindows][index].startTime = e.target.value
                                                      setCreateCampaignData(prev => ({ ...prev, weekdayWindows: newWindows }))
                                                    }}
                                                    className='w-24 text-xs h-8'
                                                  />
                                                </div>
                                                <div className='flex flex-col'>
                                                  <Label className='text-xs text-muted-foreground mb-1'>End time</Label>
                                                  <Input
                                                    type='time'
                                                    value={window.endTime}
                                                    onChange={(e) => {
                                                      const newWindows = { ...createCampaignData.weekdayWindows }
                                                      newWindows[day as keyof typeof newWindows][index].endTime = e.target.value
                                                      setCreateCampaignData(prev => ({ ...prev, weekdayWindows: newWindows }))
                                                    }}
                                                    className='w-24 text-xs h-8'
                                                  />
                                                </div>
                                              </div>
                                              <div className='flex gap-1'>
                                                {window.startTime && window.endTime && (
                                                  <Button
                                                    size='sm'
                                                    variant='ghost'
                                                    className='p-1 h-6 w-6 text-muted-foreground hover:text-foreground'
                                                    onClick={() => {
                                                      // Propagate this specific window to all other enabled days
                                                      const newWindows = { ...createCampaignData.weekdayWindows }
                                                      const windowToCopy = { startTime: window.startTime, endTime: window.endTime }

                                                      // Add the window to all enabled days only
                                                      Object.keys(newWindows).forEach(dayKey => {
                                                        if (dayKey !== day && createCampaignData.weekdayEnabled[dayKey as keyof typeof createCampaignData.weekdayEnabled]) {
                                                          newWindows[dayKey as keyof typeof newWindows] = [
                                                            ...newWindows[dayKey as keyof typeof newWindows],
                                                            windowToCopy
                                                          ]
                                                        }
                                                      })

                                                      setCreateCampaignData(prev => ({ ...prev, weekdayWindows: newWindows }))
                                                    }}
                                                    title={`Copy this window (${window.startTime} - ${window.endTime}) to all other enabled days`}
                                                  >
                                                    <Copy className='h-3 w-3' />
                                                  </Button>
                                                )}
                                                <Button
                                                  size='sm'
                                                  variant='ghost'
                                                  className='p-1 h-6 w-6 text-muted-foreground hover:text-destructive'
                                                  onClick={() => {
                                                    const newWindows = { ...createCampaignData.weekdayWindows }
                                                    newWindows[day as keyof typeof newWindows] = newWindows[day as keyof typeof newWindows].filter((_, i) => i !== index)
                                                    setCreateCampaignData(prev => ({ ...prev, weekdayWindows: newWindows }))
                                                  }}
                                                  title={`Remove this window`}
                                                >
                                                  <X className='h-3 w-3' />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        )
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                          {/* Right Column - Selected Templates */}
                          <div className='flex flex-col h-full overflow-hidden min-h-0'>
                            <Label className='text-sm font-medium mb-2 flex-shrink-0'>Selected Templates</Label>
                            <div className='flex-1 border rounded-lg p-4 bg-gray-50 overflow-y-auto min-h-0'>
                            {createCampaignData.selectedTemplates.length === 0 ? (
                              <div className='flex items-center justify-center h-full text-center text-muted-foreground'>
                                <div>
                                  <MessageSquare className='h-8 w-8 mx-auto mb-2 opacity-50' />
                                  <p className='text-sm'>No templates selected</p>
                                  <p className='text-xs'>Select templates to see them here</p>
                                </div>
                              </div>
                            ) : (
                                <div className='space-y-3 h-full overflow-y-auto'>
                                {(() => {
                                  // Group selected templates by their template groups
                                  const groupedTemplates = new Map()

                                  createCampaignData.selectedTemplates.forEach(templateId => {
                                    let foundTemplate = null
                                    let foundGroup = null

                                    for (const group of templateGroups) {
                                      const template = group.templates.find(t => t._id === templateId)
                                      if (template) {
                                        foundTemplate = template
                                        foundGroup = group
                                        break
                                      }
                                    }

                                    if (foundTemplate && foundGroup) {
                                      if (!groupedTemplates.has(foundGroup._id)) {
                                        groupedTemplates.set(foundGroup._id, {
                                          group: foundGroup,
                                          templates: []
                                        })
                                      }
                                      groupedTemplates.get(foundGroup._id).templates.push(foundTemplate)
                                    }
                                  })

                                  return Array.from(groupedTemplates.values()).map(({ group, templates }) => {
                                    const isGroupExpanded = expandedGroups.has(`selected-${group._id}`)

                                    return (
                                      <div key={group._id} className='space-y-1'>
                                        <div
                                          className='flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-100'
                                          onClick={() => {
                                            const newExpanded = new Set(expandedGroups)
                                            const groupKey = `selected-${group._id}`
                                            if (isGroupExpanded) {
                                              newExpanded.delete(groupKey)
                                            } else {
                                              newExpanded.add(groupKey)
                                            }
                                            setExpandedGroups(newExpanded)
                                          }}
                                        >
                                          <div className='flex items-center gap-2'>
                                            {isGroupExpanded ? (
                                              <ChevronDown className='h-3 w-3 text-muted-foreground' />
                                            ) : (
                                              <ChevronRight className='h-3 w-3 text-muted-foreground' />
                                            )}
                                            <span className='text-xs font-medium text-muted-foreground'>{group.name}</span>
                                          </div>
                                          <span className='text-xs text-muted-foreground'>{templates.length}</span>
                                        </div>

                                        {isGroupExpanded && (
                                          <div className='space-y-1 ml-2'>
                                              {templates.map(template => (
                                                <TemplateItem
                                                  key={template._id}
                                                  template={template}
                                                  onRemove={() => {
                                                    setCreateCampaignData(prev => ({
                                                      ...prev,
                                                      selectedTemplates: prev.selectedTemplates.filter(id => id !== template._id)
                                                    }))
                                                  }}
                                                />
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                      <TabsContent value='preview' className='flex-1 overflow-y-auto p-4 min-h-0'>
                      <div className='bg-muted/50 p-4 rounded-lg space-y-4'>
                        <h3 className='text-lg font-semibold'>Campaign Summary</h3>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <Label className='text-sm font-medium text-muted-foreground'>Campaign Name</Label>
                            <p className='text-sm'>{createCampaignData.name || 'Not specified'}</p>
                          </div>
                          <div>
                            <Label className='text-sm font-medium text-muted-foreground'>Status</Label>
                            <p className='text-sm capitalize'>{createCampaignData.status}</p>
                          </div>
                          <div>
                            <Label className='text-sm font-medium text-muted-foreground'>Selected Contacts</Label>
                            <p className='text-sm'>
                              {createCampaignData.selectedContacts.length} spreadsheet(s) selected
                              {createCampaignData.selectedContacts.length > 0 && (
                                <span className='text-muted-foreground ml-1'>
                                  ({createCampaignData.selectedContacts.reduce((sum, contactId) => {
                                    const contact = contactSpreadsheetsData?.find(c => c.id === contactId)
                                    return sum + (contact?.validContactsCount || contact?.contactCount || 0)
                                  }, 0).toLocaleString()} total contacts)
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className='text-sm font-medium text-muted-foreground'>Message Templates</Label>
                            <p className='text-sm'>
                              {createCampaignData.selectedTemplates.length > 0 ? (
                                `${createCampaignData.selectedTemplates.length} template(s) selected`
                              ) : (
                                'No templates selected'
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className='text-sm font-medium text-muted-foreground'>Send Devices</Label>
                            <p className='text-sm'>{createCampaignData.sendDevices.length} device(s) selected</p>
                          </div>
                          <div>
                            <Label className='text-sm font-medium text-muted-foreground'>Schedule</Label>
                            <p className='text-sm'>
                              {createCampaignData.scheduleType === 'now' ? 'Start sending immediately' :
                               createCampaignData.scheduleType === 'later' && createCampaignData.scheduledDate && createCampaignData.scheduledTime ?
                               `Start sending on ${createCampaignData.scheduledDate} at ${createCampaignData.scheduledTime}` :
                               createCampaignData.scheduleType === 'windows' && createCampaignData.sendingWindows.length > 0 ?
                               `${createCampaignData.sendingWindows.length} slot window(s) defined` :
                               createCampaignData.scheduleType === 'weekday' && Object.entries(createCampaignData.weekdayWindows).some(([day, dayWindows]) =>
                                 createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && dayWindows.length > 0) ?
                               `Weekday windows defined for ${Object.entries(createCampaignData.weekdayWindows).filter(([day, windows]) =>
                                 createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && windows.length > 0).length} day(s)` :
                               'Schedule not set'}
                            </p>
                            {createCampaignData.scheduleType === 'windows' && createCampaignData.sendingWindows.length > 0 && (
                              <div className='mt-2'>
                                <Label className='text-xs text-muted-foreground'>Slot Windows:</Label>
                                <div className='mt-1 space-y-1'>
                                  {createCampaignData.sendingWindows.map((window, index) => (
                                    <div key={index} className='text-xs bg-muted/50 p-2 rounded'>
                                      {window.startDate ? new Date(window.startDate).toLocaleDateString() : 'No start date'} {window.startTime || 'No start time'} → {window.endDate ? new Date(window.endDate).toLocaleDateString() : 'No end date'} {window.endTime || 'No end time'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {createCampaignData.scheduleType === 'weekday' && Object.entries(createCampaignData.weekdayWindows).some(([day, dayWindows]) =>
                              createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && dayWindows.length > 0) && (
                              <div className='mt-2'>
                                <Label className='text-xs text-muted-foreground'>Weekday Windows:</Label>
                                <div className='mt-1 space-y-1'>
                                  {Object.entries(createCampaignData.weekdayWindows).filter(([day, windows]) =>
                                    createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && windows.length > 0).map(([day, windows]) => (
                                    <div key={day} className='text-xs bg-muted/50 p-2 rounded'>
                                      <span className='font-medium capitalize'>{day}:</span> {windows.map((window, index) =>
                                        `${window.startTime || 'No start'} - ${window.endTime || 'No end'}`
                                      ).join(', ')}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className='col-span-2'>
                            <Label className='text-sm font-medium text-muted-foreground'>Description</Label>
                            <p className='text-sm'>{createCampaignData.description || 'No description provided'}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  </div>
                  <DialogFooter className='flex-shrink-0 border-t flex justify-between items-center p-4 pt-3'>
                    <div className='flex gap-2'>
                      {activeTab !== 'details' && (
                        <Button
                          variant='outline'
                          onClick={() => {
                            const tabs = ['details', 'configure', 'preview']
                            const currentIndex = tabs.indexOf(activeTab)
                            if (currentIndex > 0) {
                              setActiveTab(tabs[currentIndex - 1])
                            }
                          }}
                        >
                          Previous
                        </Button>
                      )}
                      {activeTab !== 'preview' && (
                        <Button
                          variant='outline'
                          disabled={(() => {
                            const tabs = ['details', 'configure', 'preview']
                            const currentIndex = tabs.indexOf(activeTab)
                            if (currentIndex < tabs.length - 1) {
                              const nextTab = tabs[currentIndex + 1]
                              return !canNavigateToTab(nextTab)
                            }
                            return false
                          })()}
                          onClick={() => {
                            const tabs = ['details', 'configure', 'preview']
                            const currentIndex = tabs.indexOf(activeTab)
                            if (currentIndex < tabs.length - 1) {
                              const nextTab = tabs[currentIndex + 1]
                              if (canNavigateToTab(nextTab)) {
                                setActiveTab(nextTab)
                              } else {
                                if (nextTab === 'configure' && !validateDetailsStage()) {
                                  toast({
                                    title: "Complete required fields",
                                    description: "Please fill in campaign name and select contacts before proceeding.",
                                    variant: "destructive"
                                  })
                                } else if (nextTab === 'preview' && !validateConfigureStage()) {
                                  toast({
                                    title: "Complete SMS configuration",
                                    description: "Please select template groups, devices, and schedule before previewing.",
                                    variant: "destructive"
                                  })
                                }
                              }
                            }
                          }}
                        >
                          Next
                        </Button>
                      )}
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setCreateCampaignOpen(false)
                          setActiveTab('details')
                        }}
                      >
                        Cancel
                      </Button>
                      {activeTab === 'preview' && (
                        <Button
                          onClick={handleCreateCampaign}
                          disabled={!createCampaignData.name.trim() || createCampaignData.selectedContacts.length === 0}
                        >
                          Create Campaign
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Manage Templates Dialog */}
              <Dialog open={manageTemplatesOpen} onOpenChange={setManageTemplatesOpen}>
                <DialogContent className='max-w-3xl h-[90vh] flex flex-col overflow-hidden'>
                  <DialogHeader className='flex-shrink-0 border-b p-4 pb-3'>
                    <DialogTitle>Manage Templates</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 p-4 flex-1 min-h-0 flex flex-col'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0'>
                      {/* Template Groups List */}
                      <div className='border-r pr-4 h-full flex flex-col'>
                        <div className='flex items-center justify-between flex-shrink-0 mb-4'>
                          <h3 className='text-base font-semibold'>Template Groups</h3>
                          <Button
                            size='sm'
                            variant='outline'
                            className='gap-2'
                            onClick={() => setCreateTemplateGroupOpen(true)}
                          >
                            <Plus className='h-4 w-4' />
                            New template group
                          </Button>
                        </div>
                        <div className='space-y-2 overflow-y-auto flex-1'>
                          {templateGroups.length === 0 ? (
                            <div className='text-center text-muted-foreground py-8'>
                              <MessageSquare className='h-12 w-12 mx-auto mb-2 opacity-50' />
                              <p className='text-sm'>No template groups yet</p>
                              <p className='text-xs'>Create your first template group to get started</p>
                            </div>
                          ) : (
                            templateGroups.map((group, index) => (
                              <div
                                key={group._id}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.dataTransfer.dropEffect = 'move'
                                  setDragOverGroupId(group._id)
                                }}
                                onDragLeave={() => {
                                  setDragOverGroupId(null)
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()

                                  const draggedIndex = templateGroups.findIndex(g => g._id === draggedGroupId)
                                  const targetIndex = index

                                  if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
                                    reorderTemplateGroupsMutation.mutate({
                                      sourceIndex: draggedIndex,
                                      destinationIndex: targetIndex
                                    })
                                  }

                                  setDraggedGroupId(null)
                                  setDragOverGroupId(null)
                                }}
                                className={cn(
                                  'relative transition-all duration-200',
                                  dragOverGroupId === group._id && draggedGroupId !== group._id ? 'transform translate-y-1' : ''
                                )}
                              >
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggedGroupId(group._id)
                                    e.dataTransfer.effectAllowed = 'move'
                                    e.dataTransfer.setData('text/plain', group._id)
                                    e.currentTarget.style.opacity = '0.5'
                                  }}
                                  onDragEnd={(e) => {
                                    e.currentTarget.style.opacity = '1'
                                    setDraggedGroupId(null)
                                    setDragOverGroupId(null)
                                  }}
                                  onClick={() => setSelectedTemplateGroup(group._id)}
                                  className={cn(
                                    'cursor-grab active:cursor-grabbing select-none group',
                                    'w-full p-3 rounded-md border transition-colors',
                                    selectedTemplateGroup === group._id
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background hover:bg-accent hover:text-accent-foreground border-input'
                                  )}
                                >
                                  <div className='flex items-center justify-between w-full'>
                                    <div className='flex items-center gap-2'>
                                      <GripVertical className='h-4 w-4 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity' />
                                      <span className='font-medium'>{group.name}</span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      <Badge variant={selectedTemplateGroup === group._id ? 'secondary' : 'outline'}>
                                        {group.templates.length}
                                      </Badge>
                                      <Button
                                        variant='ghost'
                                        size='sm'
                                        className='p-1 h-6 w-6 text-muted-foreground hover:text-destructive'
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (confirm(`Are you sure you want to delete "${group.name}"? This will also delete all templates in this group. This action cannot be undone.`)) {
                                            deleteTemplateGroupMutation.mutate(group._id)
                                          }
                                        }}
                                      >
                                        <Trash2 className='h-3 w-3' />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                {dragOverGroupId === group._id && draggedGroupId !== group._id && (
                                  <div className='absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded' />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Templates in Selected Group */}
                      <div className='pl-4 flex flex-col h-full min-h-0'>
                        {selectedTemplateGroup && (
                          <>
                            <div className='flex justify-end mb-4 flex-shrink-0'>
                              <Button
                                size='sm'
                                variant='outline'
                                className='gap-2'
                                onClick={() => setCreateTemplateOpen(true)}
                              >
                                <Plus className='h-4 w-4' />
                                New template
                              </Button>
                            </div>
                            <div className='space-y-2 overflow-y-auto flex-1 min-h-0 bg-muted rounded-lg p-4'>
                              {(() => {
                                const selectedGroup = templateGroups.find(g => g._id === selectedTemplateGroup)
                                const templates = selectedGroup?.templates || []

                                if (templates.length === 0) {
                                  return (
                                    <div className='flex items-center justify-center h-full text-center text-muted-foreground'>
                                      <div>
                                        <MessageSquare className='h-8 w-8 mx-auto mb-2 opacity-50' />
                                        <p className='text-sm'>No templates in this group</p>
                                        <p className='text-xs'>Add templates to see them here</p>
                                      </div>
                                    </div>
                                  )
                                }

                                return templates.map(template => (
                                  <div key={template._id} className='bg-white border rounded-lg p-3 space-y-2 shadow-sm group'>
                                    <div className='flex items-center justify-between'>
                                      <h5 className='font-medium text-sm'>{template.name}</h5>
                                      <div className='flex items-center gap-1'>
                                        <Button
                                          size='sm'
                                          variant='outline'
                                          onClick={() => handleEditTemplate(template, selectedTemplateGroup)}
                                        >
                                          <Edit className='h-3 w-3' />
                                        </Button>
                                        <Button
                                          size='sm'
                                          variant='ghost'
                                          className='text-muted-foreground hover:text-destructive'
                                          onClick={() => {
                                            if (confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
                                              deleteTemplateMutation.mutate(template._id)
                                            }
                                          }}
                                        >
                                          <Trash2 className='h-3 w-3' />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className='text-xs text-muted-foreground bg-muted/50 p-2 rounded'>
                                      {template.content}
                                    </p>
                                    <div className='text-xs text-muted-foreground'>
                                      {(() => {
                                        const variables = getVariables(template.content)
                                        return variables.length > 0
                                          ? `Variables: ${variables.join(', ')}`
                                          : 'No variables used'
                                      })()}
                                    </div>
                                  </div>
                                ))
                              })()}
                            </div>
                          </>
                        )}
                        {!selectedTemplateGroup && (
                          <div className='text-center text-muted-foreground py-8 flex-1 flex items-center justify-center'>
                            <div>
                              Select a template group to view templates
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className='flex-shrink-0'>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setManageTemplatesOpen(false)
                        setSelectedTemplateGroup(null)
                      }}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Create Template Group Dialog */}
              <Dialog open={createTemplateGroupOpen} onOpenChange={setCreateTemplateGroupOpen}>
                <DialogContent className='max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Create New Template Group</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='group-name' className='text-sm font-medium'>
                        Group Name<span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='group-name'
                        value={newTemplateGroup.name}
                        onChange={(e) => setNewTemplateGroup(prev => ({ ...prev, name: e.target.value }))}
                        placeholder='Enter group name'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='group-description' className='text-sm font-medium'>
                        Description
                      </Label>
                      <Textarea
                        id='group-description'
                        value={newTemplateGroup.description}
                        onChange={(e) => setNewTemplateGroup(prev => ({ ...prev, description: e.target.value }))}
                        placeholder='Enter group description (optional)'
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setCreateTemplateGroupOpen(false)
                        setNewTemplateGroup({ name: '', description: '' })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTemplateGroup}
                      disabled={!newTemplateGroup.name.trim()}
                    >
                      Create Group
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Create Template Dialog */}
              <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
                <DialogContent className='max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Add New Template</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='template-name' className='text-sm font-medium'>
                        Template Name<span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='template-name'
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder='Enter template name'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='template-content' className='text-sm font-medium'>
                        Message Content<span className='text-red-500'>*</span>
                      </Label>
                      <Textarea
                        id='template-content'
                        value={newTemplate.content}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                        placeholder='Enter message content (use {firstName}, {lastName}, {phone} for variables)'
                        rows={4}
                      />
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Available variables: {'{firstName}'}, {'{lastName}'}, {'{phone}'}, {'{email}'}, {'{propertyAddress}'}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setCreateTemplateOpen(false)
                        setNewTemplate({ name: '', content: '' })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTemplate}
                      disabled={!newTemplate.name.trim() || !newTemplate.content.trim()}
                    >
                      Add Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Template Dialog */}
              <Dialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen}>
                <DialogContent className='max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Edit Template</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='edit-template-name' className='text-sm font-medium'>
                        Template Name<span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='edit-template-name'
                        value={editingTemplate?.name || ''}
                        onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder='Enter template name'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='edit-template-content' className='text-sm font-medium'>
                        Message Content<span className='text-red-500'>*</span>
                      </Label>
                      <Textarea
                        id='edit-template-content'
                        value={editingTemplate?.content || ''}
                        onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                        placeholder='Enter message content (use {firstName}, {lastName}, {phone} for variables)'
                        rows={4}
                      />
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Available variables: {'{firstName}'}, {'{lastName}'}, {'{phone}'}, {'{email}'}, {'{propertyAddress}'}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setEditTemplateOpen(false)
                        setEditingTemplate(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateTemplate}
                      disabled={!editingTemplate?.name.trim() || !editingTemplate?.content.trim()}
                    >
                      Update Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Template Selection Dialog */}
              <Dialog open={templateSelectionOpen} onOpenChange={setTemplateSelectionOpen}>
                <DialogContent className='w-[700px] max-h-[90vh] max-w-none overflow-hidden flex flex-col'>
                  <DialogHeader className='flex-shrink-0 border-b p-4 pb-3'>
                    <DialogTitle>Select Message Templates</DialogTitle>
                  </DialogHeader>
                  <div className='flex-1 overflow-y-auto p-4 min-h-0'>
                    {templateGroups.length === 0 ? (
                      <div className='text-center text-muted-foreground py-8'>
                        <MessageSquare className='h-12 w-12 mx-auto mb-2 opacity-50' />
                        <p className='text-sm'>No template groups available</p>
                        <p className='text-xs'>Create template groups and templates first</p>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {templateGroups.map(group => {
                          const isGroupExpanded = expandedGroups.has(group._id)
                          const groupTemplates = group.templates || []
                          const selectedInGroup = groupTemplates.filter(t => createCampaignData.selectedTemplates.includes(t._id))
                          const allGroupSelected = groupTemplates.length > 0 && selectedInGroup.length === groupTemplates.length
                          const someGroupSelected = selectedInGroup.length > 0 && selectedInGroup.length < groupTemplates.length

                          return (
                            <div key={group._id} className='border rounded-lg p-3'>
                              <div className='flex items-center justify-between mb-2'>
                                <div className='flex items-center space-x-2'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='p-1 h-6 w-6'
                                    onClick={() => {
                                      const newExpanded = new Set(expandedGroups)
                                      if (isGroupExpanded) {
                                        newExpanded.delete(group._id)
                                      } else {
                                        newExpanded.add(group._id)
                                      }
                                      setExpandedGroups(newExpanded)
                                    }}
                                  >
                                    {isGroupExpanded ? (
                                      <ChevronDown className='h-4 w-4' />
                                    ) : (
                                      <ChevronRight className='h-4 w-4' />
                                    )}
                                  </Button>
                                  <Checkbox
                                    checked={allGroupSelected}
                                    indeterminate={someGroupSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        // Select all templates in group
                                        const newSelected = [...createCampaignData.selectedTemplates]
                                        groupTemplates.forEach(template => {
                                          if (!newSelected.includes(template._id)) {
                                            newSelected.push(template._id)
                                          }
                                        })
                                        setCreateCampaignData(prev => ({ ...prev, selectedTemplates: newSelected }))
                                      } else {
                                        // Deselect all templates in group
                                        const templateIds = groupTemplates.map(t => t._id)
                                        setCreateCampaignData(prev => ({
                                          ...prev,
                                          selectedTemplates: prev.selectedTemplates.filter(id => !templateIds.includes(id))
                                        }))
                                      }
                                    }}
                                  />
                                  <div className='flex-1'>
                                    <div className='font-medium text-sm'>{group.name}</div>
                                    <div className='text-xs text-muted-foreground'>
                                      {groupTemplates.length} template(s) • {selectedInGroup.length} selected
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {isGroupExpanded && (
                                <div className='ml-6 space-y-2'>
                                  {groupTemplates.map(template => (
                                    <TemplateSelectionItem
                                      key={template._id}
                                      template={template}
                                      isSelected={createCampaignData.selectedTemplates.includes(template._id)}
                                      onToggle={() => {
                                        const isSelected = createCampaignData.selectedTemplates.includes(template._id)
                                        if (isSelected) {
                                          setCreateCampaignData(prev => ({
                                            ...prev,
                                            selectedTemplates: prev.selectedTemplates.filter(id => id !== template._id)
                                          }))
                                        } else {
                                          setCreateCampaignData(prev => ({
                                            ...prev,
                                            selectedTemplates: [...prev.selectedTemplates, template._id]
                                          }))
                                        }
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <DialogFooter className='flex-shrink-0 border-t flex justify-between items-center p-4 pt-3'>
                    <Button
                      variant='outline'
                      onClick={() => setTemplateSelectionOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setTemplateSelectionOpen(false)}
                      disabled={createCampaignData.selectedTemplates.length === 0}
                    >
                      OK ({createCampaignData.selectedTemplates.length} selected)
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className='flex items-center gap-4'>
              {isSomeSelected && (
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>{selectedCampaigns.length} selected</Badge>
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-2'
                    onClick={handleDeleteSelectedCampaigns}
                  >
                    <Trash2 className='h-4 w-4' />
                    Delete campaign(s)
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
          ) : totalCampaigns === 0 ? (
            <div className='flex flex-col items-center justify-center h-full py-16'>
              <Megaphone className='h-16 w-16 text-muted-foreground/50 mb-4' />
              <h3 className='text-lg font-semibold text-muted-foreground mb-2'>No campaigns</h3>
              <p className='text-sm text-muted-foreground mb-6 text-center max-w-md'>
                Create your first campaign to start reaching your contacts.
              </p>
              <Button className='gap-2' onClick={() => setCreateCampaignOpen(true)}>
                <Plus className='h-4 w-4' />
                Create new campaign
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
                  <th
                    className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                    onClick={() => handleCampaignSort('name')}
                  >
                    <div className='flex items-center'>
                      Campaign name
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                    onClick={() => handleCampaignSort('status')}
                  >
                    <div className='flex items-center'>
                      Status
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th
                    className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                    onClick={() => handleCampaignSort('contacts')}
                  >
                    <div className='flex items-center'>
                      Contacts
                      {renderSortIcon('contacts')}
                    </div>
                  </th>
                  <th
                    className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                    onClick={() => handleCampaignSort('groups')}
                  >
                    <div className='flex items-center'>
                      Groups
                      {renderSortIcon('groups')}
                    </div>
                  </th>
                  <th
                    className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                    onClick={() => handleCampaignSort('dateCreated')}
                  >
                    <div className='flex items-center'>
                      Date created
                      {renderSortIcon('dateCreated')}
                    </div>
                  </th>
                  <th
                    className='text-left p-4 font-medium cursor-pointer hover:bg-muted/75 transition-colors'
                    onClick={() => handleCampaignSort('lastSent')}
                  >
                    <div className='flex items-center'>
                      Last sent
                      {renderSortIcon('lastSent')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className='border-b hover:bg-muted/25 transition-colors'
                  >
                    <td className='p-4'>
                      <Checkbox
                        checked={selectedCampaigns.includes(campaign.id)}
                        onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                      />
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center gap-2'>
                        <Megaphone className='h-4 w-4 text-muted-foreground' />
                        <div>
                          <div className='font-medium'>{campaign.name}</div>
                          {campaign.description && (
                            <div className='text-xs text-muted-foreground'>
                              {campaign.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='p-4'>
                      {getStatusDisplay(campaign.status)}
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      {campaign.contacts.toLocaleString()}
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      {campaign.groups}
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      <div className='flex flex-col'>
                        <span>{new Date(campaign.dateCreated).toLocaleDateString()}</span>
                        <span className='text-xs text-muted-foreground'>
                          {new Date(campaign.dateCreated).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      {campaign.lastSent ? (
                        <div className='flex flex-col'>
                          <span>{new Date(campaign.lastSent).toLocaleDateString()}</span>
                          <span className='text-xs text-muted-foreground'>
                            {new Date(campaign.lastSent).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination - Always at bottom */}
        <div className='border-t p-4 mt-auto flex-shrink-0'>
          {totalCampaigns > 0 ? (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Showing 1-{Math.min(displayCount, filteredAndSortedCampaigns.length)} of {filteredAndSortedCampaigns.length} campaigns
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
                  Page {currentPage} of {Math.ceil(filteredAndSortedCampaigns.length / displayCount) || 1}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.min(Math.ceil(filteredAndSortedCampaigns.length / displayCount), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(filteredAndSortedCampaigns.length / displayCount)}
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
    </div>
  )
}
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
  Plus,
  Check,
  Calendar,
  Settings,
  FileText,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { contactsApi, ContactSpreadsheet } from '@/lib/api/contacts'
import { campaignsApi, MessageTemplateGroup, MessageTemplate, ReorderTemplateGroupsDto } from '@/lib/api/campaigns'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog'
import { ManageTemplatesDialog } from '@/components/campaigns/ManageTemplatesDialog'
import { TemplateSelectionDialog } from '@/components/campaigns/TemplateSelectionDialog'
import { TemplateItem } from '@/components/campaigns/TemplateItem'


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
  const [createCampaignData, setCreateCampaignData] = useState(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
    const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: timezone })

    return {
      name: '',
      description: '',
      status: 'draft' as 'active' | 'draft' | 'inactive' | 'completed',
      selectedContacts: [] as string[],
      selectedTemplates: [] as string[], // Changed from messageTemplateGroups to selectedTemplates
      sendDevices: [] as string[],
      scheduleType: 'now' as 'now' | 'later' | 'windows' | 'weekday',
      scheduledDate: '',
      scheduledTime: '',
      campaignStartDate: today, // Default to today in selected timezone
      campaignEndDate: oneMonthLater, // Default to one month from now in selected timezone
      timezone: timezone,
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
    }
  })
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false)
  const [dateValidationErrors, setDateValidationErrors] = useState({
    startDateError: '',
    endDateError: ''
  })
  const [templateSelectionOpen, setTemplateSelectionOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [uniqueContactCount, setUniqueContactCount] = useState<number>(0)

  // Date validation function
  const validateDates = (startDate: string, endDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    const errors = { startDateError: '', endDateError: '' }

    // Don't validate start date if schedule type is 'now' (disabled field)
    if (createCampaignData.scheduleType !== 'now' && startDate && startDate < today) {
      errors.startDateError = 'Campaign start date cannot be before today'
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errors.endDateError = 'Campaign end date cannot be before start date'
    }

    setDateValidationErrors(errors)
    return errors.startDateError === '' && errors.endDateError === ''
  }

  // Update campaign start date when schedule type is "now" or timezone changes
  useEffect(() => {
    if (createCampaignData.scheduleType === 'now' || createCampaignOpen) {
      const currentDate = new Date().toLocaleDateString('en-CA', { timeZone: createCampaignData.timezone })
      if (createCampaignData.campaignStartDate !== currentDate) {
        setCreateCampaignData(prev => ({
          ...prev,
          campaignStartDate: currentDate
        }))
      }
    }
  }, [createCampaignData.scheduleType, createCampaignData.timezone, createCampaignOpen])

  // Validate dates when dialog opens or schedule type changes
  useEffect(() => {
    if (createCampaignOpen) {
      validateDates(createCampaignData.campaignStartDate, createCampaignData.campaignEndDate)
    }
  }, [createCampaignOpen, createCampaignData.scheduleType])

  // Validation functions for each stage
  const validateDetailsStage = () => {
    return createCampaignData.selectedContacts.length > 0 && createCampaignData.selectedTemplates.length > 0
  }

  const validateConfigureStage = () => {
    const hasName = createCampaignData.name.trim() !== ''
    const hasDevices = createCampaignData.sendDevices.length > 0
    const hasValidDates = createCampaignData.campaignStartDate &&
                         createCampaignData.campaignEndDate &&
                         dateValidationErrors.startDateError === '' &&
                         dateValidationErrors.endDateError === ''
    const hasValidSchedule = createCampaignData.scheduleType === 'now' ||
      (createCampaignData.scheduleType === 'later' &&
       createCampaignData.scheduledDate &&
       createCampaignData.scheduledTime) ||
      (createCampaignData.scheduleType === 'windows' &&
       createCampaignData.sendingWindows.length > 0) ||
      (createCampaignData.scheduleType === 'weekday' &&
       Object.entries(createCampaignData.weekdayWindows).some(([day, dayWindows]) =>
         createCampaignData.weekdayEnabled[day as keyof typeof createCampaignData.weekdayEnabled] && dayWindows.length > 0))

    return hasName && hasDevices && hasValidDates && hasValidSchedule
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
      refetchTemplateGroups()
      queryClient.invalidateQueries({ queryKey: ['template-groups'] })
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
    setDateValidationErrors({ startDateError: '', endDateError: '' })
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
      campaignStartDate: new Date().toISOString().split('T')[0],
      campaignEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
              <CreateCampaignDialog
                open={createCampaignOpen}
                onOpenChange={setCreateCampaignOpen}
                campaignData={createCampaignData}
                onCampaignDataChange={setCreateCampaignData}
                contactSpreadsheets={contactSpreadsheetsData}
                devices={devicesData?.data}
                templateGroups={templateGroups}
                uniqueContactCount={uniqueContactCount}
                dateValidationErrors={dateValidationErrors}
                onDateValidationChange={setDateValidationErrors}
                onManageTemplatesOpen={() => setManageTemplatesOpen(true)}
                onTemplateSelectionOpen={() => setTemplateSelectionOpen(true)}
                onCreateCampaign={handleCreateCampaign}
              />

              <Button className='gap-2' onClick={() => setCreateCampaignOpen(true)}>
                <Plus className='h-4 w-4' />
                Create new campaign
              </Button>

              <ManageTemplatesDialog
                open={manageTemplatesOpen}
                onOpenChange={setManageTemplatesOpen}
                templateGroups={templateGroups}
                onCreateTemplateGroup={async (data) => {
                  await createTemplateGroupMutation.mutateAsync(data)
                }}
                onDeleteTemplateGroup={async (id) => {
                  await deleteTemplateGroupMutation.mutateAsync(id)
                }}
                onReorderTemplateGroups={async (sourceIndex, destinationIndex) => {
                  await reorderTemplateGroupsMutation.mutateAsync({ sourceIndex, destinationIndex })
                }}
                onCreateTemplate={async (data) => {
                  await createTemplateMutation.mutateAsync(data)
                }}
                onUpdateTemplate={async (id, data) => {
                  await updateTemplateMutation.mutateAsync({ id, data })
                }}
                onDeleteTemplate={async (id) => {
                  await deleteTemplateMutation.mutateAsync(id)
                }}
              />

              {/* Template Selection Dialog */}
              <TemplateSelectionDialog
                open={templateSelectionOpen}
                onOpenChange={setTemplateSelectionOpen}
                templateGroups={templateGroups}
                campaignData={createCampaignData}
                onCampaignDataChange={setCreateCampaignData}
                expandedGroups={expandedGroups}
                onExpandedGroupsChange={setExpandedGroups}
              />
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



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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { contactsApi, ContactSpreadsheet } from '@/lib/api/contacts'
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
    messageTemplateGroups: [] as string[],
    sendDevices: [] as string[],
    scheduleType: 'now' as 'now' | 'later',
    scheduledDate: '',
    scheduledTime: '',
  })
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false)
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [createTemplateGroupOpen, setCreateTemplateGroupOpen] = useState(false)
  const [newTemplateGroup, setNewTemplateGroup] = useState({
    name: '',
    description: ''
  })
  const [templateGroups, setTemplateGroups] = useState<any[]>([])
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

  // Validation functions for each stage
  const validateDetailsStage = () => {
    return createCampaignData.name.trim() !== '' && createCampaignData.selectedContacts.length > 0
  }

  const validateConfigureStage = () => {
    const hasTemplateGroups = createCampaignData.messageTemplateGroups.length > 0
    const hasDevices = createCampaignData.sendDevices.length > 0
    const hasValidSchedule = createCampaignData.scheduleType === 'now' ||
      (createCampaignData.scheduleType === 'later' &&
       createCampaignData.scheduledDate &&
       createCampaignData.scheduledTime)

    return hasTemplateGroups && hasDevices && hasValidSchedule
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

  // Template groups will be fetched from API
  const mockTemplateGroups: any[] = templateGroups

  // Campaigns will be fetched from API
  useEffect(() => {
    // TODO: Replace with actual API call
    setCampaigns([])
    setLoading(false)
  }, [])

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
      messageTemplateGroups: [],
      sendDevices: [],
      scheduleType: 'now',
      scheduledDate: '',
      scheduledTime: '',
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

  const handleCreateTemplateGroup = () => {
    if (!newTemplateGroup.name.trim()) {
      toast({
        title: "Template group name required",
        description: "Please enter a name for the template group.",
        variant: "destructive"
      })
      return
    }

    const templateGroup = {
      id: Date.now().toString(),
      name: newTemplateGroup.name,
      description: newTemplateGroup.description,
      templates: [],
      createdAt: new Date().toISOString()
    }

    setTemplateGroups([...templateGroups, templateGroup])
    setNewTemplateGroup({ name: '', description: '' })
    setCreateTemplateGroupOpen(false)

    toast({
      title: "Template group created",
      description: "New template group has been created successfully."
    })
  }

  const handleCreateTemplate = () => {
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

    const template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      content: newTemplate.content,
      createdAt: new Date().toISOString()
    }

    setTemplateGroups(templateGroups.map(group =>
      group.id === selectedTemplateGroup
        ? { ...group, templates: [...group.templates, template] }
        : group
    ))

    setNewTemplate({ name: '', content: '' })
    setCreateTemplateOpen(false)

    toast({
      title: "Template created",
      description: "New template has been created successfully."
    })
  }

  const handleEditTemplate = (template: any, groupId: string) => {
    setEditingTemplate({
      id: template.id,
      groupId: groupId,
      name: template.name,
      content: template.content
    })
    setEditTemplateOpen(true)
  }

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return

    if (!editingTemplate.name.trim() || !editingTemplate.content.trim()) {
      toast({
        title: "Template fields required",
        description: "Please enter both name and content for the template.",
        variant: "destructive"
      })
      return
    }

    setTemplateGroups(templateGroups.map(group =>
      group.id === editingTemplate.groupId
        ? {
            ...group,
            templates: group.templates.map((template: any) =>
              template.id === editingTemplate.id
                ? {
                    ...template,
                    name: editingTemplate.name,
                    content: editingTemplate.content,
                    updatedAt: new Date().toISOString()
                  }
                : template
            )
          }
        : group
    ))

    setEditingTemplate(null)
    setEditTemplateOpen(false)

    toast({
      title: "Template updated",
      description: "Template has been updated successfully."
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
              <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
                <DialogTrigger asChild>
                  <Button className='gap-2'>
                    <Plus className='h-4 w-4' />
                    Create new campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                  </DialogHeader>
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
                  }} className='w-full'>
                    <TabsList className='grid w-full grid-cols-3'>
                      <TabsTrigger value='details' className='flex items-center gap-2'>
                        <FileText className='h-4 w-4' />
                        Details
                      </TabsTrigger>
                      <TabsTrigger
                        value='configure'
                        disabled={!canNavigateToTab('configure')}
                        className='flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Settings className='h-4 w-4' />
                        Configure SMS
                      </TabsTrigger>
                      <TabsTrigger
                        value='preview'
                        disabled={!canNavigateToTab('preview')}
                        className='flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Eye className='h-4 w-4' />
                        Preview
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value='details' className='space-y-4 mt-6'>
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
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>
                          Selected Contacts<span className='text-red-500'>*</span>
                        </Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={createCampaignData.selectedContacts.length > 0
                                ? `${createCampaignData.selectedContacts.length} spreadsheet(s) selected`
                                : 'Select contact spreadsheets'}
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
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value='configure' className='space-y-4 mt-6'>
                      <div className='w-1/2 space-y-2'>
                        <div className='flex items-center justify-between'>
                          <Label className='text-sm font-medium'>
                            Message Template Groups<span className='text-red-500'>*</span>
                          </Label>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setManageTemplatesOpen(true)}
                          >
                            Manage templates
                          </Button>
                        </div>
                        <Select>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={createCampaignData.messageTemplateGroups.length > 0
                                ? `${createCampaignData.messageTemplateGroups.length} group(s) selected`
                                : 'Select template groups'}
                            />
                          </SelectTrigger>
                          <SelectContent className='max-h-60 overflow-y-auto'>
                            {mockTemplateGroups.map(group => (
                              <div key={group.id} className='flex items-center space-x-2 px-2 py-2 cursor-pointer hover:bg-muted/50'
                                   onClick={(e) => {
                                     e.preventDefault()
                                     const isSelected = createCampaignData.messageTemplateGroups.includes(group.id)
                                     if (isSelected) {
                                       setCreateCampaignData(prev => ({
                                         ...prev,
                                         messageTemplateGroups: prev.messageTemplateGroups.filter(id => id !== group.id)
                                       }))
                                     } else {
                                       setCreateCampaignData(prev => ({
                                         ...prev,
                                         messageTemplateGroups: [...prev.messageTemplateGroups, group.id]
                                       }))
                                     }
                                   }}>
                                <Checkbox
                                  checked={createCampaignData.messageTemplateGroups.includes(group.id)}
                                  onChange={() => {}}
                                />
                                <div className='text-sm'>
                                  <div className='font-medium'>{group.name}</div>
                                  <div className='text-xs text-muted-foreground'>
                                    {group.templates.length} template(s) • Random selection per contact
                                  </div>
                                </div>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Selected Templates List */}
                        {createCampaignData.messageTemplateGroups.length > 0 && (
                          <div className='space-y-2 mt-4'>
                            <Label className='text-xs font-medium text-muted-foreground'>
                              Selected Templates ({createCampaignData.messageTemplateGroups.reduce((sum, groupId) => {
                                const group = mockTemplateGroups.find(g => g.id === groupId)
                                return sum + (group?.templates.length || 0)
                              }, 0)} total)
                            </Label>
                            <div className='max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/20'>
                              <div className='space-y-1'>
                                {createCampaignData.messageTemplateGroups.map(groupId => {
                                  const group = mockTemplateGroups.find(g => g.id === groupId)
                                  return group?.templates.map(template => (
                                    <div key={template.id} className='flex items-center justify-between px-2 py-1 text-xs rounded hover:bg-muted/50'>
                                      <span className='font-medium'>{template.name}</span>
                                      <Badge variant='outline' className='text-xs'>
                                        {group.name}
                                      </Badge>
                                    </div>
                                  ))
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className='w-1/2 space-y-2'>
                        <Label className='text-sm font-medium'>
                          Send Devices<span className='text-red-500'>*</span>
                        </Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={createCampaignData.sendDevices.length > 0
                                ? `${createCampaignData.sendDevices.length} device(s) selected`
                                : 'Select send devices'}
                            />
                          </SelectTrigger>
                          <SelectContent className='max-h-60 overflow-y-auto'>
                            <div className='flex items-center space-x-2 px-2 py-2 border-b cursor-pointer hover:bg-muted/50'
                                 onClick={(e) => {
                                   e.preventDefault()
                                   const allDeviceIds = devicesData?.data?.filter(d => d.enabled).map(d => d._id) || []
                                   const isAllSelected = allDeviceIds.every(id => createCampaignData.sendDevices.includes(id))
                                   if (isAllSelected) {
                                     setCreateCampaignData(prev => ({ ...prev, sendDevices: [] }))
                                   } else {
                                     setCreateCampaignData(prev => ({ ...prev, sendDevices: allDeviceIds }))
                                   }
                                 }}>
                              <Checkbox
                                checked={devicesData?.data?.filter(d => d.enabled).length > 0 &&
                                        devicesData?.data?.filter(d => d.enabled).every(d => createCampaignData.sendDevices.includes(d._id))}
                                onChange={() => {}}
                              />
                              <div className='text-sm font-medium'>Select all enabled devices</div>
                            </div>
                            {devicesData?.data?.length === 0 ? (
                              <div className='px-2 py-4 text-center text-sm text-muted-foreground'>
                                No devices registered.
                                <br />
                                Register devices in the Dashboard first.
                              </div>
                            ) : (
                              devicesData?.data?.map(device => (
                                <div key={device._id} className='flex items-center space-x-2 px-2 py-2 cursor-pointer hover:bg-muted/50'
                                     onClick={(e) => {
                                       e.preventDefault()
                                       const isSelected = createCampaignData.sendDevices.includes(device._id)
                                       if (isSelected) {
                                         setCreateCampaignData(prev => ({
                                           ...prev,
                                           sendDevices: prev.sendDevices.filter(id => id !== device._id)
                                         }))
                                       } else {
                                         setCreateCampaignData(prev => ({
                                           ...prev,
                                           sendDevices: [...prev.sendDevices, device._id]
                                         }))
                                       }
                                     }}>
                                  <Checkbox
                                    checked={createCampaignData.sendDevices.includes(device._id)}
                                    onChange={() => {}}
                                  />
                                  <div className='text-sm'>
                                    <div className='flex items-center justify-between gap-3'>
                                      <span className='font-medium'>{device.brand} {device.model}</span>
                                      <Badge variant={device.enabled ? 'default' : 'secondary'} className='text-xs'>
                                        {device.enabled ? 'Enabled' : 'Disabled'}
                                      </Badge>
                                    </div>
                                    <div className='mt-1'>
                                      <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs text-muted-foreground'>
                                        {device._id}
                                      </code>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </SelectContent>
                        </Select>
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
                              Send now
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
                              Schedule for later
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
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value='preview' className='space-y-4 mt-6'>
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
                            <Label className='text-sm font-medium text-muted-foreground'>Template Groups</Label>
                            <p className='text-sm'>
                              {createCampaignData.messageTemplateGroups.length > 0 ? (
                                <>
                                  {createCampaignData.messageTemplateGroups.map(groupId => {
                                    const group = mockTemplateGroups.find(g => g.id === groupId)
                                    return group ? group.name : 'Unknown group'
                                  }).join(', ')}
                                  <span className='text-muted-foreground ml-1'>
                                    ({createCampaignData.messageTemplateGroups.reduce((sum, groupId) => {
                                      const group = mockTemplateGroups.find(g => g.id === groupId)
                                      return sum + (group?.templates.length || 0)
                                    }, 0)} total templates)
                                  </span>
                                </>
                              ) : (
                                'No template groups selected'
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
                              {createCampaignData.scheduleType === 'now' ? 'Send immediately' :
                               createCampaignData.scheduledDate && createCampaignData.scheduledTime ?
                               `Send on ${createCampaignData.scheduledDate} at ${createCampaignData.scheduledTime}` :
                               'Schedule not set'}
                            </p>
                          </div>
                          <div className='col-span-2'>
                            <Label className='text-sm font-medium text-muted-foreground'>Description</Label>
                            <p className='text-sm'>{createCampaignData.description || 'No description provided'}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter className='flex justify-between'>
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
                <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
                  <DialogHeader>
                    <DialogTitle>Manage Templates</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold'>Template Groups</h3>
                      <Button
                        size='sm'
                        className='gap-2'
                        onClick={() => setCreateTemplateGroupOpen(true)}
                      >
                        <Plus className='h-4 w-4' />
                        Create new template group
                      </Button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {/* Template Groups List */}
                      <div className='space-y-2'>
                        {mockTemplateGroups.length === 0 ? (
                          <div className='text-center text-muted-foreground py-8'>
                            <MessageSquare className='h-12 w-12 mx-auto mb-2 opacity-50' />
                            <p className='text-sm'>No template groups yet</p>
                            <p className='text-xs'>Create your first template group to get started</p>
                          </div>
                        ) : (
                          mockTemplateGroups.map(group => (
                            <Button
                              key={group.id}
                              variant={selectedTemplateGroup === group.id ? 'default' : 'outline'}
                              className='w-full justify-start'
                              onClick={() => setSelectedTemplateGroup(group.id)}
                            >
                              <div className='flex items-center justify-between w-full'>
                                <span>{group.name}</span>
                                <Badge variant='secondary'>{group.templates.length}</Badge>
                              </div>
                            </Button>
                          ))
                        )}
                      </div>

                      {/* Templates in Selected Group */}
                      <div className='space-y-2'>
                        {selectedTemplateGroup && (
                          <>
                            <div className='flex items-center justify-between'>
                              <h4 className='font-medium'>
                                {mockTemplateGroups.find(g => g.id === selectedTemplateGroup)?.name} Templates
                              </h4>
                              <Button
                                size='sm'
                                variant='outline'
                                className='gap-2'
                                onClick={() => setCreateTemplateOpen(true)}
                              >
                                <Plus className='h-4 w-4' />
                                Add new template
                              </Button>
                            </div>
                            <div className='space-y-2'>
                              {mockTemplateGroups
                                .find(g => g.id === selectedTemplateGroup)
                                ?.templates.map(template => (
                                  <div key={template.id} className='border rounded-lg p-3 space-y-2'>
                                    <div className='flex items-center justify-between'>
                                      <h5 className='font-medium text-sm'>{template.name}</h5>
                                      <Button
                                        size='sm'
                                        variant='outline'
                                        onClick={() => handleEditTemplate(template, selectedTemplateGroup)}
                                      >
                                        <Edit className='h-3 w-3' />
                                      </Button>
                                    </div>
                                    <p className='text-xs text-muted-foreground bg-muted/50 p-2 rounded'>
                                      {template.content}
                                    </p>
                                    <div className='text-xs text-muted-foreground'>
                                      Variables: {'{firstName}'}, {'{lastName}'}, {'{phone}'} etc.
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          </>
                        )}
                        {!selectedTemplateGroup && (
                          <div className='text-center text-muted-foreground py-8'>
                            Select a template group to view templates
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
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
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
  Megaphone,
  ChevronUp,
  ChevronDown,
  Edit,
  Save,
  X,
  MessageSquare,
  Plus,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  })

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock data for now - replace with API calls later
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        _id: '1',
        id: '1',
        name: 'Summer Sale Campaign',
        status: 'active',
        contacts: 1250,
        groups: 3,
        dateCreated: '2024-01-15T10:30:00Z',
        lastSent: '2024-01-20T14:45:00Z',
        description: 'Promotional campaign for summer products'
      },
      {
        _id: '2',
        id: '2',
        name: 'Holiday Special',
        status: 'completed',
        contacts: 2100,
        groups: 5,
        dateCreated: '2023-12-01T09:15:00Z',
        lastSent: '2023-12-25T08:00:00Z',
        description: 'Holiday season promotional campaign'
      },
      {
        _id: '3',
        id: '3',
        name: 'New Product Launch',
        status: 'draft',
        contacts: 800,
        groups: 2,
        dateCreated: '2024-01-22T16:20:00Z',
        description: 'Campaign for upcoming product launch'
      },
      {
        _id: '4',
        id: '4',
        name: 'Customer Retention',
        status: 'inactive',
        contacts: 950,
        groups: 4,
        dateCreated: '2024-01-10T11:45:00Z',
        lastSent: '2024-01-15T13:30:00Z',
        description: 'Re-engagement campaign for inactive customers'
      }
    ]

    setTimeout(() => {
      setCampaigns(mockCampaigns)
      setLoading(false)
    }, 500)
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

    const newCampaign: Campaign = {
      _id: Date.now().toString(),
      id: Date.now().toString(),
      name: createCampaignData.name,
      status: createCampaignData.status,
      contacts: 0,
      groups: 0,
      dateCreated: new Date().toISOString(),
      description: createCampaignData.description,
    }

    setCampaigns([newCampaign, ...campaigns])
    setCreateCampaignOpen(false)
    setCreateCampaignData({
      name: '',
      description: '',
      status: 'draft',
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
              <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
                <DialogTrigger asChild>
                  <Button className='gap-2'>
                    <Plus className='h-4 w-4' />
                    Create new campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-2xl'>
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
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
                      <Label htmlFor='status' className='text-sm font-medium'>
                        Status
                      </Label>
                      <Select
                        value={createCampaignData.status}
                        onValueChange={(value: 'active' | 'draft' | 'inactive' | 'completed') =>
                          setCreateCampaignData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='draft'>Draft</SelectItem>
                          <SelectItem value='active'>Active</SelectItem>
                          <SelectItem value='inactive'>Inactive</SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
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
                        placeholder='Enter campaign description'
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setCreateCampaignOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCampaign}
                      disabled={!createCampaignData.name.trim()}
                    >
                      Create Campaign
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
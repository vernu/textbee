'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Trash2,
  MessageSquare,
  Plus,
  Settings,
  Eye,
  FileText,
  Copy,
  X,
} from 'lucide-react'
import { ContactSpreadsheet } from '@/lib/api/contacts'
import {
  CreateCampaignData,
  DateValidationErrors,
  MessageTemplateGroup
} from '@/components/campaigns/types/campaign.types'
import { SendingScheduleCalendar } from './SendingScheduleCalendar'

// Device interface (from API response)
interface Device {
  _id: string
  brand: string
  model: string
  enabled: boolean
  max_hourly_send_rate?: number
  daily_send_limit?: number
}

// Props interface for the CreateCampaignDialog component
interface CreateCampaignDialogProps {
  // Dialog state
  open: boolean
  onOpenChange: (open: boolean) => void

  // Campaign data and handlers
  campaignData: CreateCampaignData
  onCampaignDataChange: (data: CreateCampaignData) => void

  // External data
  contactSpreadsheets?: ContactSpreadsheet[]
  devices?: Device[]
  templateGroups?: MessageTemplateGroup[]
  uniqueContactCount: number

  // Date validation
  dateValidationErrors: DateValidationErrors
  onDateValidationChange: (errors: DateValidationErrors) => void

  // Template management
  onManageTemplatesOpen: () => void
  onTemplateSelectionOpen: () => void

  // Callback functions
  onCreateCampaign: () => void
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  campaignData,
  onCampaignDataChange,
  contactSpreadsheets = [],
  devices = [],
  templateGroups = [],
  uniqueContactCount,
  dateValidationErrors,
  onDateValidationChange,
  onManageTemplatesOpen,
  onTemplateSelectionOpen,
  onCreateCampaign
}: CreateCampaignDialogProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [timezoneSearch, setTimezoneSearch] = useState('')
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false)
  const { toast } = useToast()

  // Memoized filtered timezones
  const filteredTimezones = useMemo(() => {
    const allTimezones = Intl.supportedValuesOf('timeZone')
    if (!timezoneSearch.trim()) {
      return allTimezones
    }
    return allTimezones.filter(tz =>
      tz.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
      tz.replace(/_/g, ' ').toLowerCase().includes(timezoneSearch.toLowerCase())
    )
  }, [timezoneSearch])

  // Date validation function
  const validateDates = (startDate: string, endDate: string) => {
    // Get today's date in the selected timezone
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: campaignData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    const errors = { startDateError: '', endDateError: '' }

    // Don't validate start date if schedule type is 'now' (disabled field)
    // Allow today's date by checking if startDate is strictly less than today
    if (campaignData.scheduleType !== 'now' && startDate && new Date(startDate + 'T00:00:00') < new Date(today + 'T00:00:00')) {
      errors.startDateError = 'Campaign start date cannot be before today'
    }

    if (startDate && endDate && new Date(endDate + 'T00:00:00') < new Date(startDate + 'T00:00:00')) {
      errors.endDateError = 'Campaign end date cannot be before start date'
    }

    onDateValidationChange(errors)
    return errors.startDateError === '' && errors.endDateError === ''
  }

  // Validate dates when dialog opens or schedule type changes
  useEffect(() => {
    if (open) {
      validateDates(campaignData.campaignStartDate, campaignData.campaignEndDate)
    }
  }, [open, campaignData.scheduleType])

  // Validation functions for each stage
  const validateDetailsStage = () => {
    return campaignData.selectedContacts.length > 0
  }

  const validateConfigureStage = () => {
    const hasCampaignName = campaignData.name.trim().length > 0
    const hasTemplates = campaignData.selectedTemplates.length > 0
    const hasDevices = campaignData.sendDevices.length > 0
    const hasValidDates = campaignData.campaignStartDate &&
                         campaignData.campaignEndDate &&
                         dateValidationErrors.startDateError === '' &&
                         dateValidationErrors.endDateError === ''
    const hasValidSchedule = campaignData.scheduleType === 'now' ||
      campaignData.scheduleType === 'later' ||
      (campaignData.scheduleType === 'windows' &&
       campaignData.sendingWindows.length > 0) ||
      (campaignData.scheduleType === 'weekday' &&
       Object.entries(campaignData.weekdayWindows).some(([day, dayWindows]) =>
         campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && dayWindows.length > 0))

    return hasCampaignName && hasTemplates && hasDevices && hasValidDates && hasValidSchedule
  }

  const canNavigateToTab = (targetTab: string) => {
    if (targetTab === 'details') return true
    if (targetTab === 'configure') return validateDetailsStage()
    if (targetTab === 'preview') return validateDetailsStage() && validateConfigureStage()
    return false
  }

  const handleClose = () => {
    onOpenChange(false)
    setActiveTab('details')
    onDateValidationChange({ startDateError: '', endDateError: '' })
  }

  const handleTabChange = (value: string) => {
    if (canNavigateToTab(value)) {
      setActiveTab(value)
    } else {
      if (value === 'configure' && !validateDetailsStage()) {
        toast({
          title: "Complete required fields",
          description: "Please select contacts before proceeding.",
          variant: "destructive"
        })
      } else if (value === 'preview' && !validateConfigureStage()) {
        toast({
          title: "Complete SMS configuration",
          description: "Please enter campaign name, select template groups, devices, and schedule before previewing.",
          variant: "destructive"
        })
      }
    }
  }

  const handlePrevious = () => {
    const tabs = ['details', 'configure', 'preview']
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }

  const handleNext = () => {
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
            description: "Please select contacts before proceeding.",
            variant: "destructive"
          })
        } else if (nextTab === 'preview' && !validateConfigureStage()) {
          toast({
            title: "Complete SMS configuration",
            description: "Please enter campaign name, select template groups, devices, and schedule before previewing.",
            variant: "destructive"
          })
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[90vw] max-w-6xl h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader className='flex-shrink-0 border-b p-4 pb-3'>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        <div className='flex-1 overflow-hidden min-h-0'>
          <Tabs value={activeTab} onValueChange={handleTabChange} className='h-full flex flex-col'>
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
                  <div className='flex items-center justify-between'>
                    <Label className='text-sm font-medium'>
                      Message Templates<span className='text-red-500'>*</span>
                    </Label>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={onManageTemplatesOpen}
                    >
                      Manage templates
                    </Button>
                  </div>
                  <Button
                    variant='outline'
                    className='w-full justify-start h-10'
                    onClick={onTemplateSelectionOpen}
                  >
                    <MessageSquare className='mr-2 h-4 w-4' />
                    {campaignData.selectedTemplates.length > 0
                      ? `${campaignData.selectedTemplates.length} template(s) selected`
                      : 'Select message templates'}
                  </Button>
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    Selected Contacts<span className='text-red-500'>*</span>
                  </Label>
                  <Select>
                    <SelectTrigger className='w-full'>
                      <SelectValue
                        placeholder={campaignData.selectedContacts.length > 0
                          ? `${campaignData.selectedContacts.length} group(s) selected (${uniqueContactCount.toLocaleString()} unique contacts)`
                          : 'Select contact groups'}
                      />
                    </SelectTrigger>
                    <SelectContent className='max-h-60 overflow-y-auto'>
                      {contactSpreadsheets.length === 0 ? (
                        <div className='px-2 py-4 text-center text-sm text-muted-foreground'>
                          No processed contact spreadsheets available.
                          <br />
                          Process spreadsheets in the Contacts page first.
                        </div>
                      ) : (
                        contactSpreadsheets.map(contact => (
                          <div key={contact.id} className='flex items-center space-x-2 px-2 py-2 cursor-pointer hover:bg-muted/50'
                               onClick={(e) => {
                                 e.preventDefault()
                                 const isSelected = campaignData.selectedContacts.includes(contact.id)
                                 if (isSelected) {
                                   onCampaignDataChange({
                                     ...campaignData,
                                     selectedContacts: campaignData.selectedContacts.filter(id => id !== contact.id)
                                   })
                                 } else {
                                   onCampaignDataChange({
                                     ...campaignData,
                                     selectedContacts: [...campaignData.selectedContacts, contact.id]
                                   })
                                 }
                               }}>
                            <Checkbox
                              checked={campaignData.selectedContacts.includes(contact.id)}
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
                    value={campaignData.description}
                    onChange={(e) => {
                      onCampaignDataChange({ ...campaignData, description: e.target.value })
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
                  <Label htmlFor='name' className='text-sm font-medium'>
                    Campaign Name<span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='name'
                    value={campaignData.name}
                    onChange={(e) => {
                      onCampaignDataChange({ ...campaignData, name: e.target.value })
                    }}
                    placeholder='Enter campaign name'
                    className='w-full'
                  />
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
                          checked={devices.filter(d => d.enabled).length > 0 &&
                                  devices.filter(d => d.enabled).every(d => campaignData.sendDevices.includes(d._id))}
                          onCheckedChange={(checked) => {
                            const allEnabledDeviceIds = devices.filter(d => d.enabled).map(d => d._id)
                            if (checked) {
                              onCampaignDataChange({ ...campaignData, sendDevices: allEnabledDeviceIds })
                            } else {
                              onCampaignDataChange({ ...campaignData, sendDevices: [] })
                            }
                          }}
                        />
                        <span className='text-sm font-medium'>Select/Unselect all enabled devices</span>
                      </div>
                    </div>

                    {/* Device List */}
                    {devices.length === 0 ? (
                      <div className='text-center text-sm text-muted-foreground py-4'>
                        No devices registered.
                        <br />
                        Register devices in the Dashboard first.
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {devices.map(device => (
                          <div key={device._id} className='flex items-center justify-between p-2 rounded border bg-background'>
                            <div className='flex items-center space-x-2'>
                              <Checkbox
                                checked={campaignData.sendDevices.includes(device._id)}
                                disabled={!device.enabled}
                                onCheckedChange={(checked) => {
                                  if (!device.enabled) return
                                  if (checked) {
                                    onCampaignDataChange({
                                      ...campaignData,
                                      sendDevices: [...campaignData.sendDevices, device._id]
                                    })
                                  } else {
                                    onCampaignDataChange({
                                      ...campaignData,
                                      sendDevices: campaignData.sendDevices.filter(id => id !== device._id)
                                    })
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
                  <Select
                    value={campaignData.scheduleType}
                    onValueChange={(value) => onCampaignDataChange({ ...campaignData, scheduleType: value as any })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select scheduling option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Start sending now</SelectItem>
                      <SelectItem value="later">Schedule start for later</SelectItem>
                      <SelectItem value="weekday">Define valid sending windows by weekday</SelectItem>
                      <SelectItem value="windows">Define valid sending windows by slot</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Campaign Start and End Date fields */}
                  <div className='space-y-2'>
                    {/* Timezone info display */}
                    <div className='text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200'>
                      <strong>Current timezone:</strong> {campaignData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                      {' '}({new Date().toLocaleTimeString('en-US', {
                        timeZone: campaignData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                        timeZoneName: 'short'
                      }).split(' ').pop()}) - Today is {new Date().toLocaleDateString('en-CA', {
                        timeZone: campaignData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
                      })}
                    </div>
                    <div className='flex gap-4'>
                      <div className='space-y-1 flex-1'>
                        <Label className='text-xs text-muted-foreground'>
                          Campaign Start Date<span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          type='date'
                          value={campaignData.campaignStartDate}
                          disabled={campaignData.scheduleType === 'now'}
                          onChange={(e) => {
                            const newStartDate = e.target.value
                            onCampaignDataChange({
                              ...campaignData,
                              campaignStartDate: newStartDate
                            })
                            validateDates(newStartDate, campaignData.campaignEndDate)
                          }}
                          className='w-full'
                        />
                        {dateValidationErrors.startDateError && (
                          <p className='text-xs text-red-600'>{dateValidationErrors.startDateError}</p>
                        )}
                      </div>
                      <div className='space-y-1 flex-1'>
                        <Label className='text-xs text-muted-foreground'>
                          Campaign End Date<span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          type='date'
                          value={campaignData.campaignEndDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value
                            onCampaignDataChange({
                              ...campaignData,
                              campaignEndDate: newEndDate
                            })
                            validateDates(campaignData.campaignStartDate, newEndDate)
                          }}
                          className='w-full'
                        />
                        {dateValidationErrors.endDateError && (
                          <p className='text-xs text-red-600'>{dateValidationErrors.endDateError}</p>
                        )}
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-xs text-muted-foreground'>
                        Timezone
                      </Label>
                      <div className="relative">
                        <Select
                          open={timezoneDropdownOpen}
                          onOpenChange={setTimezoneDropdownOpen}
                          value={campaignData.timezone}
                          onValueChange={(value) => {
                            onCampaignDataChange({ ...campaignData, timezone: value })
                            setTimezoneDropdownOpen(false)
                            setTimezoneSearch('')
                            // Re-validate dates when timezone changes
                            validateDates(campaignData.campaignStartDate, campaignData.campaignEndDate)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select timezone..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <div className="p-2 border-b">
                              <Input
                                placeholder="Search timezones..."
                                value={timezoneSearch}
                                onChange={(e) => setTimezoneSearch(e.target.value)}
                                className="h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                autoFocus={false}
                              />
                            </div>
                            <div className="overflow-y-auto max-h-40">
                              {filteredTimezones.length > 0 ? (
                                filteredTimezones.map(tz => (
                                  <SelectItem key={tz} value={tz}>
                                    {tz.replace(/_/g, ' ')} ({new Date().toLocaleTimeString('en-US', {
                                      timeZone: tz,
                                      timeZoneName: 'short'
                                    }).split(' ').pop()})
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="py-2 px-3 text-sm text-muted-foreground">
                                  No timezones found
                                </div>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                    {campaignData.scheduleType === 'windows' && (
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
                              onCampaignDataChange({
                                ...campaignData,
                                sendingWindows: [...campaignData.sendingWindows, { startDate: '', startTime: '', endDate: '', endTime: '' }]
                              })
                              // Auto-scroll to bottom after adding new window
                              setTimeout(() => {
                                const leftColumn = document.querySelector('[role="dialog"] .space-y-4.overflow-y-auto.max-h-full.pr-4')
                                if (leftColumn) {
                                  leftColumn.scrollTo({
                                    top: leftColumn.scrollHeight,
                                    behavior: 'smooth'
                                  })
                                }
                              }, 100)
                            }}
                          >
                            <Plus className='h-3 w-3' />
                            Add window
                          </Button>
                        </div>

                        {campaignData.sendingWindows.length === 0 ? (
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
                            {campaignData.sendingWindows.map((window, index) => (
                              <div key={index} className='flex items-center gap-2 p-2 bg-muted/30 rounded border'>
                                <div className='flex gap-2 flex-1'>
                                  <Input
                                    type='date'
                                    value={window.startDate}
                                    onChange={(e) => {
                                      const newWindows = [...campaignData.sendingWindows]
                                      newWindows[index].startDate = e.target.value
                                      // Auto-update end date if it's empty
                                      if (!newWindows[index].endDate) {
                                        newWindows[index].endDate = e.target.value
                                      }
                                      onCampaignDataChange({ ...campaignData, sendingWindows: newWindows })
                                    }}
                                    className='w-32 text-xs h-8'
                                  />
                                  <Input
                                    type='time'
                                    value={window.startTime}
                                    onChange={(e) => {
                                      const newWindows = [...campaignData.sendingWindows]
                                      newWindows[index].startTime = e.target.value
                                      onCampaignDataChange({ ...campaignData, sendingWindows: newWindows })
                                    }}
                                    className='w-24 text-xs h-8'
                                  />
                                  <Input
                                    type='date'
                                    value={window.endDate}
                                    onChange={(e) => {
                                      const newWindows = [...campaignData.sendingWindows]
                                      newWindows[index].endDate = e.target.value
                                      onCampaignDataChange({ ...campaignData, sendingWindows: newWindows })
                                    }}
                                    className='w-32 text-xs h-8'
                                  />
                                  <Input
                                    type='time'
                                    value={window.endTime}
                                    onChange={(e) => {
                                      const newWindows = [...campaignData.sendingWindows]
                                      newWindows[index].endTime = e.target.value
                                      onCampaignDataChange({ ...campaignData, sendingWindows: newWindows })
                                    }}
                                    className='w-24 text-xs h-8'
                                  />
                                </div>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  className='p-1 h-6 w-6 text-muted-foreground hover:text-destructive'
                                  onClick={() => {
                                    const newWindows = campaignData.sendingWindows.filter((_, i) => i !== index)
                                    onCampaignDataChange({ ...campaignData, sendingWindows: newWindows })
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
                    {campaignData.scheduleType === 'weekday' && (
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
                                  checked={campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled]}
                                  onCheckedChange={(checked) => {
                                    onCampaignDataChange({
                                      ...campaignData,
                                      weekdayEnabled: {
                                        ...campaignData.weekdayEnabled,
                                        [day]: checked as boolean
                                      }
                                    })
                                  }}
                                  className='h-4 w-4'
                                />
                                <Label className={`text-sm font-medium capitalize cursor-pointer ${
                                  campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled]
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                }`}>
                                  {day}
                                </Label>
                              </div>
                              <div className='flex gap-2'>
                                {campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && (
                                  <>
                                    {campaignData.weekdayWindows[day as keyof typeof campaignData.weekdayWindows].length > 0 && (
                                      <Button
                                        size='sm'
                                        variant='outline'
                                        className='gap-1 text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10'
                                        onClick={() => {
                                          onCampaignDataChange({
                                            ...campaignData,
                                            weekdayWindows: {
                                              ...campaignData.weekdayWindows,
                                              [day]: []
                                            }
                                          })
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
                                        onCampaignDataChange({
                                          ...campaignData,
                                          weekdayWindows: {
                                            ...campaignData.weekdayWindows,
                                            [day]: [...campaignData.weekdayWindows[day as keyof typeof campaignData.weekdayWindows], { startTime: '', endTime: '' }]
                                          }
                                        })
                                      }}
                                    >
                                      <Plus className='h-3 w-3' />
                                      Add window
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && (
                              campaignData.weekdayWindows[day as keyof typeof campaignData.weekdayWindows].length === 0 ? (
                                <div className='text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded border-dashed border ml-4'>
                                  No windows for {day}
                                </div>
                              ) : (
                              <div className='ml-4 space-y-2'>
                                {campaignData.weekdayWindows[day as keyof typeof campaignData.weekdayWindows].map((window, index) => (
                                  <div key={index} className='flex items-center gap-2 p-2 bg-muted/20 rounded border'>
                                    <div className='flex gap-2 flex-1'>
                                      <div className='flex flex-col'>
                                        <Label className='text-xs text-muted-foreground mb-1'>Start time</Label>
                                        <Input
                                          type='time'
                                          value={window.startTime}
                                          onChange={(e) => {
                                            const newWindows = { ...campaignData.weekdayWindows }
                                            newWindows[day as keyof typeof newWindows][index].startTime = e.target.value
                                            onCampaignDataChange({ ...campaignData, weekdayWindows: newWindows })
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
                                            const newWindows = { ...campaignData.weekdayWindows }
                                            newWindows[day as keyof typeof newWindows][index].endTime = e.target.value
                                            onCampaignDataChange({ ...campaignData, weekdayWindows: newWindows })
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
                                            const newWindows = { ...campaignData.weekdayWindows }
                                            const windowToCopy = { startTime: window.startTime, endTime: window.endTime }

                                            // Add the window to all enabled days only
                                            Object.keys(newWindows).forEach(dayKey => {
                                              if (dayKey !== day && campaignData.weekdayEnabled[dayKey as keyof typeof campaignData.weekdayEnabled]) {
                                                newWindows[dayKey as keyof typeof newWindows] = [
                                                  ...newWindows[dayKey as keyof typeof newWindows],
                                                  windowToCopy
                                                ]
                                              }
                                            })

                                            onCampaignDataChange({ ...campaignData, weekdayWindows: newWindows })
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
                                          const newWindows = { ...campaignData.weekdayWindows }
                                          newWindows[day as keyof typeof newWindows] = newWindows[day as keyof typeof newWindows].filter((_, i) => i !== index)
                                          onCampaignDataChange({ ...campaignData, weekdayWindows: newWindows })
                                        }}
                                        title={`Remove this window`}
                                      >
                                        <X className='h-3 w-3' />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Sending Schedule */}
                <div className='flex flex-col h-full overflow-hidden min-h-0'>
                  <Label className='text-sm font-medium mb-2 flex-shrink-0'>Sending Schedule</Label>
                  <div className='flex-1 border rounded-lg p-4 bg-white overflow-hidden min-h-0'>
                    <SendingScheduleCalendar campaignData={campaignData} />
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
                  <p className='text-sm'>{campaignData.name || 'Not specified'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Status</Label>
                  <p className='text-sm capitalize'>{campaignData.status}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Selected Contacts</Label>
                  <p className='text-sm'>
                    {campaignData.selectedContacts.length} spreadsheet(s) selected
                    {campaignData.selectedContacts.length > 0 && (
                      <span className='text-muted-foreground ml-1'>
                        ({campaignData.selectedContacts.reduce((sum, contactId) => {
                          const contact = contactSpreadsheets?.find(c => c.id === contactId)
                          return sum + (contact?.validContactsCount || contact?.contactCount || 0)
                        }, 0).toLocaleString()} total contacts)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Message Templates</Label>
                  <p className='text-sm'>
                    {campaignData.selectedTemplates.length > 0 ? (
                      `${campaignData.selectedTemplates.length} template(s) selected`
                    ) : (
                      'No templates selected'
                    )}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Send Devices</Label>
                  <p className='text-sm'>{campaignData.sendDevices.length} device(s) selected</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Schedule</Label>
                  <p className='text-sm'>
                    {campaignData.scheduleType === 'now' ? 'Start sending immediately' :
                     campaignData.scheduleType === 'later' && campaignData.scheduledDate && campaignData.scheduledTime ?
                     `Start sending on ${campaignData.scheduledDate} at ${campaignData.scheduledTime}` :
                     campaignData.scheduleType === 'windows' && campaignData.sendingWindows.length > 0 ?
                     `${campaignData.sendingWindows.length} slot window(s) defined` :
                     campaignData.scheduleType === 'weekday' && Object.entries(campaignData.weekdayWindows).some(([day, dayWindows]) =>
                       campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && dayWindows.length > 0) ?
                     `Weekday windows defined for ${Object.entries(campaignData.weekdayWindows).filter(([day, windows]) =>
                       campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && windows.length > 0).length} day(s)` :
                     'Schedule not set'}
                  </p>
                  {campaignData.scheduleType === 'windows' && campaignData.sendingWindows.length > 0 && (
                    <div className='mt-2'>
                      <Label className='text-xs text-muted-foreground'>Slot Windows:</Label>
                      <div className='mt-1 space-y-1'>
                        {campaignData.sendingWindows.map((window, index) => (
                          <div key={index} className='text-xs bg-muted/50 p-2 rounded'>
                            {window.startDate ? new Date(window.startDate).toLocaleDateString() : 'No start date'} {window.startTime || 'No start time'} → {window.endDate ? new Date(window.endDate).toLocaleDateString() : 'No end date'} {window.endTime || 'No end time'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {campaignData.scheduleType === 'weekday' && Object.entries(campaignData.weekdayWindows).some(([day, dayWindows]) =>
                    campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && dayWindows.length > 0) && (
                    <div className='mt-2'>
                      <Label className='text-xs text-muted-foreground'>Weekday Windows:</Label>
                      <div className='mt-1 space-y-1'>
                        {Object.entries(campaignData.weekdayWindows).filter(([day, windows]) =>
                          campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && windows.length > 0).map(([day, windows]) => (
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
                  <p className='text-sm'>{campaignData.description || 'No description provided'}</p>
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
                onClick={handlePrevious}
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
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleClose}
            >
              Cancel
            </Button>
            {activeTab === 'preview' && (
              <Button
                onClick={onCreateCampaign}
                disabled={!campaignData.name.trim() || campaignData.selectedContacts.length === 0}
              >
                Create Campaign
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
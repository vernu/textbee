'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiEndpoints } from '@/config/api'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useQuery } from '@tanstack/react-query'
import {
  MessageSquare,
  Smartphone,
  Calendar,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import ProductClient from '../webhooks/(components)/webhook-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'


const WebhooksHistory = () => {
  const {
    data: devices,
    isLoading: isLoadingDevices,
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  const [currentDevice, setCurrentDevice] = useState('all')
  const [eventType, setEventType] = useState('all')
  const [status, setStatus] = useState('all')
  const [dateRange, setDateRange] = useState<string>('90')
  const [openCal, setOpenCal] = useState(false)
  const [dateQuery, setDateQuery] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectOpen, setSelectOpen] = useState(false)

  const formatDateForInput = (isoDateString: string) => {
    if (!isoDateString) return ''
    try {
      const date = new Date(isoDateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (e) {
      return ''
    }
  }

  useEffect(() => {
    if (!dateQuery.start && dateRange === '90') {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 90)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      
      setDateQuery({ start: start.toISOString(), end: end.toISOString() })
    }
  }, [dateQuery.start, dateRange])


  const {
    data: webhookNotifications,
    isLoading: isLoadingNotifications,
  } = useQuery({
    queryKey: [
      'webhook-notification',
      eventType,
      page,
      limit,
      currentDevice,
      status,
      dateQuery.start,
      dateQuery.end,
    ],
    enabled: !!dateQuery.start && !!dateQuery.end,
    queryFn: () => {
      const startParam = dateQuery.start ? encodeURIComponent(dateQuery.start) : ''
      const endParam = dateQuery.end ? encodeURIComponent(dateQuery.end) : ''
      const deviceIdParam = currentDevice === 'all' ? '' : currentDevice

      return httpBrowserClient
        .get(
          `${ApiEndpoints.gateway.getWebhookNotifications()}?eventType=${
            eventType === 'all' ? '' : eventType
          }&page=${page}&limit=${limit}&status=${
            status === 'all' ? '' : status
          }&start=${startParam}&end=${endParam}&deviceId=${deviceIdParam}`
        )
        .then((res) => res.data)
    },
  })

  const totalPages = webhookNotifications?.data?.meta?.totalPages || 1

  const handlePageChange = (currentPage: number) => {
    setPage(currentPage)
  }
  const handleMessageTypeChange = (type: string) => {
    setEventType(type)
    setPage(1)
  }
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
  }

  const handleDateRangeChange = (range: string) => {
    setDateRange(range)
    setPage(1)

    if (range === 'custom') {
      setOpenCal(true)
      return
    }
    
    setOpenCal(false)

    const end = new Date()
    const start = new Date()

    end.setHours(23, 59, 59, 999) 

    switch (range) {
      case '7':
        start.setDate(end.getDate() - 7)
        break
      case '30':
        start.setDate(end.getDate() - 30)
        break
      case '90':
        start.setDate(end.getDate() - 90)
        break
      case '90_months':
        start.setMonth(end.getMonth() - 3)
        break
      case '180':
        start.setMonth(end.getMonth() - 6)
        break
      case '365':
        start.setMonth(end.getMonth() - 12)
        break
      default:
        setDateQuery({ start: '', end: '' })
        return
    }

    start.setHours(0, 0, 0, 0)

    setDateQuery({ start: start.toISOString(), end: end.toISOString() })
  }

  const handleDeviceChange = (deviceId: string) => {
    setCurrentDevice(deviceId)
    setPage(1)
  }

  const [tempCustomDates, setTempCustomDates] = useState({
    start: dateQuery.start,
    end: dateQuery.end,
  })

  useEffect(() => {
    if (openCal) {
        setTempCustomDates({
          start: dateQuery.start,
          end: dateQuery.end,
        });
    }
  }, [openCal, dateQuery])


  const handleCustomDateApply = () => {
    if (tempCustomDates.start && tempCustomDates.end) {
      const startDate = new Date(tempCustomDates.start)
      const endDate = new Date(tempCustomDates.end)

      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      
      setDateQuery({ start: startDate.toISOString(), end: endDate.toISOString() })
      setPage(1)
      setOpenCal(false)
    }
  }

  const handleCustomDateCancel = () => {
    setOpenCal(false)
    if (dateRange === 'custom') {
        handleDateRangeChange('90');
    }
  }

  const message_events = [
    'MESSAGE_RECEIVED',
    'MESSAGE_SENT',
    'MESSAGE_DELIVERED',
    'MESSAGE_FAILED',
    'UNKNOWN_STATE',
  ]

  return (
    <div className="flex flex-col gap-y-4">
      <div className="bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-950/30 dark:to-sky-950/30 rounded-lg shadow-sm border border-brand-100 dark:border-brand-800/50 p-4 mb-4">
        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            
            <div className="w-full sm:w-auto min-w-[150px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Smartphone className="h-3.5 w-3.5 text-brand-500" />
                <h3 className="text-sm font-medium text-foreground">Device</h3>
              </div>
              <Select value={currentDevice} onValueChange={handleDeviceChange}>
                <SelectTrigger className="w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">
                    All devices
                  </SelectItem>
                  {devices?.data?.data?.map((device: any) => (
                    <SelectItem key={device._id} value={device._id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {device.brand} {device.model}
                        </span>
                        {!device.enabled && (
                          <Badge
                            variant="outline"
                            className="ml-1 text-xs py-0 h-5"
                          >
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                <h3 className="text-sm font-medium text-foreground">
                  Event Type
                </h3>
              </div>
              <Select value={eventType} onValueChange={handleMessageTypeChange}>
                <SelectTrigger className="w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70">
                  <SelectValue placeholder="Message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                      All Events
                    </div>
                  </SelectItem>
                    {message_events.map((event) => (
                        <SelectItem value={event} key={event}>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                        {event}
                      </div>
                    </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-44">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                <h3 className="text-sm font-medium text-foreground">Status</h3>
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                      All
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Delivered
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Failed
                    </div>
                  </SelectItem>
                  <SelectItem value="retrying">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                      Retrying
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-brand-500" />
                <h3 className="text-sm font-medium text-foreground">
                  Date Range
                </h3>
              </div>
              <Popover open={openCal} onOpenChange={setOpenCal}>
                <Select 
                    value={dateRange} 
                    onValueChange={handleDateRangeChange}
                    open={selectOpen}
                    onOpenChange={setSelectOpen}
                >
                  <PopoverTrigger asChild>
                    <SelectTrigger 
                        className="w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70"
                    >
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                  </PopoverTrigger>
                  <SelectContent 
                    onPointerDownOutside={(e) => {
                        // Prevent select from closing the popover when custom is active
                        if(dateRange === 'custom') {
                            e.preventDefault();
                        }
                    }}
                  >
                    <SelectGroup>
                      <SelectItem value="7">
                        <div className="flex items-center gap-1.5">Last 7 Days</div>
                      </SelectItem>
                      <SelectItem value="30">
                        <div className="flex items-center gap-1.5">
                          Last 30 Days
                        </div>
                      </SelectItem>
                      <SelectItem value="90">
                        <div className="flex items-center gap-1.5">
                          Last 90 Days
                        </div>
                      </SelectItem>
                      <SelectItem value="90_months">
                        <div className="flex items-center gap-1.5">
                          Last 3 Months
                        </div>
                      </SelectItem>
                      <SelectItem value="180">
                        <div className="flex items-center gap-1.5">
                          Last 6 Months
                        </div>
                      </SelectItem>
                      <SelectItem value="365">
                        <div className="flex items-center gap-1.5">
                          Last 12 Months
                        </div>
                      </SelectItem>
                      <SelectItem 
                        value="custom" 
                        onSelect={(e) => {
                            // Stop select from closing itself when 'custom' is picked
                            e.preventDefault(); 
                            handleDateRangeChange('custom');
                            setSelectOpen(false); // Manually close the Select dropdown
                        }}
                        >
                        <div className="flex items-center gap-1.5">Custom</div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {dateRange === 'custom' && (
                  <PopoverContent className="p-4 w-64" align="start">
                    <div className="flex flex-col gap-3">
                      <div>
                        <label
                          className="block text-xs mb-1"
                          htmlFor="start-date"
                        >
                          Start Date
                        </label>
                        <input
                          id="start-date"
                          type="date"
                          className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                          value={formatDateForInput(tempCustomDates.start)}
                          onChange={(e) =>
                            setTempCustomDates({
                              ...tempCustomDates,
                              start: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs mb-1"
                          htmlFor="end-date"
                        >
                          End Date
                        </label>
                        <input
                          id="end-date"
                          type="date"
                          className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600"
                          value={formatDateForInput(tempCustomDates.end)}
                          onChange={(e) =>
                            setTempCustomDates({
                              ...tempCustomDates,
                              end: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCustomDateCancel}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCustomDateApply}
                          disabled={!tempCustomDates.start || !tempCustomDates.end}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            </div>
          </div>
          
          <div className="mt-4">
            {isLoadingNotifications || !dateQuery.start ? (
              <ProductClient data={[]} isLoading={true} status={status} />
            ) : (
              <ProductClient
                data={webhookNotifications?.data?.data || []}
                isLoading={false}
                status={status}
              />
            )}
          </div>
          
          <div className="flex justify-end gap-x-3">
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1 || isLoadingNotifications}
                  variant={page === 1 ? 'ghost' : 'default'}
                >
                  Previous
                </Button>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  
                  {totalPages > 1 && (
                    <Button
                      onClick={() => handlePageChange(1)}
                      variant={page === 1 ? 'default' : 'ghost'}
                      size="icon"
                      className={`h-8 w-8 rounded-full ${
                        page === 1
                          ? 'bg-primary text-brand-foreground hover:bg-primary/90'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      1
                    </Button>
                  )}

                  {page > 4 && totalPages > 7 && (
                    <span className="px-1">...</span>
                  )}

                  {Array.from(
                    {
                      length: Math.min(totalPages > 7 ? 5 : totalPages - 2, Math.max(0, totalPages - 2)),
                    },
                    (_, i) => {
                      let pageToShow: number

                      if (totalPages <= 7) {
                        pageToShow = i + 2
                      } else if (page <= 4) {
                        pageToShow = i + 2
                      } else if (page >= totalPages - 3) {
                        pageToShow = totalPages - 5 + i
                      } else {
                        pageToShow = page - 2 + i
                      }

                      if (pageToShow > 1 && pageToShow < totalPages) {
                        return (
                          <Button
                            key={pageToShow}
                            onClick={() => handlePageChange(pageToShow)}
                            variant={page === pageToShow ? 'default' : 'ghost'}
                            size="icon"
                            className={`h-8 w-8 rounded-full ${
                              page === pageToShow
                                ? 'bg-primary text-brand-foreground hover:bg-primary/90'
                                : 'hover:bg-secondary'
                            }`}
                          >
                            {pageToShow}
                          </Button>
                        )
                      }
                      return null
                    }
                  )}

                  {page < totalPages - 3 && totalPages > 7 && (
                    <span className="px-1">...</span>
                  )}

                  {totalPages > 1 && (
                    <Button
                      onClick={() => handlePageChange(totalPages)}
                      variant={page === totalPages ? 'default' : 'ghost'}
                      size="icon"
                      className={`h-8 w-8 rounded-full ${
                        page === totalPages
                          ? 'bg-primary text-brand-foreground hover:bg-primary/90'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {totalPages}
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, page + 1))
                  }
                  disabled={
                    page === totalPages || isLoadingNotifications
                  }
                  variant={page === totalPages ? 'ghost' : 'default'}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebhooksHistory
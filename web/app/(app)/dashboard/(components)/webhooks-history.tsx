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
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Ellipsis,
  MessageSquare,
  Smartphone,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import ProductClient from '../webhooks/(components)/webhook-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from 'lucide-react'
import { truncate } from 'fs'

const skeletons = [
  {
    createdAt: <Skeleton className="w-20 h-4" />,
    event: <Skeleton className="w-20 h-4" />,
    deviceId: <Skeleton className="w-20 h-4" />,
    deviceName: <Skeleton className="w-20 h-4" />,
    sms: { status: <Skeleton className="w-20 h-4" /> },
    webhookSubscription: { deliveryUrl: <Skeleton className="w-20 h-4" /> },
  },
  {
    createdAt: <Skeleton className="w-20 h-4" />,
    event: <Skeleton className="w-20 h-4" />,
    deviceId: <Skeleton className="w-20 h-4" />,
    deviceName: <Skeleton className="w-20 h-4" />,
    sms: { status: <Skeleton className="w-20 h-4" /> },
    webhookSubscription: { deliveryUrl: <Skeleton className="w-20 h-4" /> },
  },
  {
    createdAt: <Skeleton className="w-20 h-4" />,
    event: <Skeleton className="w-20 h-4" />,
    deviceId: <Skeleton className="w-20 h-4" />,
    deviceName: <Skeleton className="w-20 h-4" />,
    sms: { status: <Skeleton className="w-20 h-4" /> },
    webhookSubscription: { deliveryUrl: <Skeleton className="w-20 h-4" /> },
  },
  {
    createdAt: <Skeleton className="w-20 h-4" />,
    event: <Skeleton className="w-20 h-4" />,
    deviceId: <Skeleton className="w-20 h-4" />,
    deviceName: <Skeleton className="w-20 h-4" />,
    sms: { status: <Skeleton className="w-20 h-4" /> },
    webhookSubscription: { deliveryUrl: <Skeleton className="w-20 h-4" /> },
  },
  {
    createdAt: <Skeleton className="w-20 h-4" />,
    event: <Skeleton className="w-20 h-4" />,
    deviceId: <Skeleton className="w-20 h-4" />,
    deviceName: <Skeleton className="w-20 h-4" />,
    sms: { status: <Skeleton className="w-20 h-4" /> },
    webhookSubscription: { deliveryUrl: <Skeleton className="w-20 h-4" /> },
  },
]

const WebhooksHistory = () => {
  const {
    data: devices,
    isLoading: isLoadingDevices,
    error: devicesError,
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  const [currentDevice, setCurrentDevice] = useState('')
  const [eventType, setEventType] = useState('MESSAGE_RECEIVED')
  const [status, setStatus] = useState('delivered')
  const [dateRange, setDateRange] = useState<any>('90')
  const [openCal, setOpenCal] = useState(false)
  const [dateQuery, setDateQuery] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (devices?.data?.length) {
      setCurrentDevice(devices?.data?.[0]?._id)
    }
  }, [devices])

  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true)
      const res = await httpBrowserClient
        .get(
          `${ApiEndpoints.gateway.getWebhookNotifications()}?eventType=${eventType}&status=${status}&start=${
            dateQuery.start
          }&end=${dateQuery.end}&deviceId=${currentDevice}`
        )
        .then((res) => res.data)
      console.log('total notifications', res.data.length)
      setTotalPages(Math.max(Math.ceil(res.data.length / 10), 1))
      setIsLoading(false)
    }
    fetchNotifications()
  }, [eventType, status, dateQuery.start, dateQuery.end, currentDevice])

  console.log('totalPages ', totalPages)
  const {
    data: webhookNotifications,
    isLoading: isLoadingNotifications,
    error: webhookNotificationsError,
    refetch,
  } = useQuery({
    queryKey: [
      'webhook-notification',
      eventType,
      page,
      limit,
      currentDevice,
      status,
    ],
    enabled: !!currentDevice,
    queryFn: () =>
      httpBrowserClient
        .get(
          `${ApiEndpoints.gateway.getWebhookNotifications()}?eventType=${eventType}&page=${page}&limit=${limit}&status=${status}&start=${
            dateQuery.start
          }&end=${dateQuery.end}&deviceId=${currentDevice}`
        )
        .then((res) => res.data),
  })

  console.log(webhookNotifications)
  const handlePageChange = (currentPage: number) => {
    setPage(currentPage)
  }
  const handleMessageTypeChange = (type: string) => {
    setEventType(type)
    setPage(1)
  }
  const handleStatusChange = (status: string) => {
    setStatus(status)
    setPage(1)
  }
  const handleDateRangeChange = (range: string) => {
    const end = new Date() // today
    const start = new Date()

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
      case 'custom':
        setDateQuery({ start: '', end: '' })
        setDateRange('custom')
        setOpenCal(true)
        return
    }

    // Save ISO strings for easier API usage
    setDateQuery({ start: start.toISOString(), end: end.toISOString() })
    setDateRange(range) // keep string for UI selection
    setPage(1) // reset pagination
  }

  const handleDeviceChange = (deviceId: string) => {
    setCurrentDevice(deviceId)
    setPage(1)
  }
  console.log(dateQuery)
  return (
    <div className="flex flex-col gap-y-4">
      <div className="bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-950/30 dark:to-sky-950/30 rounded-lg shadow-sm border border-brand-100 dark:border-brand-800/50 p-4 mb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="">
              <div className="flex items-center gap-2 mb-1.5">
                <Smartphone className="h-3.5 w-3.5 text-brand-500" />
                <h3 className="text-sm font-medium text-foreground">Device</h3>
              </div>
              <Select value={currentDevice} onValueChange={handleDeviceChange}>
                <SelectTrigger className="w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices?.data?.map((device) => (
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
                  <SelectItem value="MESSAGE_RECEIVED">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      MESSAGE_RECEIVED
                    </div>
                  </SelectItem>
                  <SelectItem value="SMS_STATUS_UPDATED">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      SMS_STATUS_UPDATED
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-44">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                <h3 className="text-sm font-medium text-foreground">Status</h3>
              </div>
              {/* status(delivered, pending, failed, retrying) */}
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
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
                <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                <h3 className="text-sm font-medium text-foreground">
                  Date Range
                </h3>{' '}
              </div>
              {/* date range ( today, last 3 days, last 7 days, last 30 days-default, last 90 days, custom)
Custom should trigger a popover to set a custom date range ( two date inputs) */}
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-full bg-white/80 dark:bg-black/20 h-9 text-sm border-brand-200 dark:border-brand-800/70">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectItem value="custom">
                    <div className="flex items-center gap-1.5">Custom</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-fit">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3.5 w-3.5 text-brand-500" />
                <div className="text-sm font-medium text-foreground" />
              </div>
              {dateRange === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => {
                        setOpenCal(true)
                      }}
                      className="flex items-center gap-2 mt-2 w-full border rounded-md px-2 py-1 text-sm"
                    >
                      <Calendar className="h-4 w-4" />
                      {dateQuery.start && dateQuery.end
                        ? `${new Date(
                            dateQuery.start
                          ).toLocaleDateString()} → ${new Date(
                            dateQuery.end
                          ).toLocaleDateString()}`
                        : 'Select custom range'}
                    </button>
                  </PopoverTrigger>
                  {openCal && (
                    <PopoverContent className="p-4 w-64">
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
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={dateQuery.start}
                            onChange={(e) =>
                              setDateQuery({
                                ...dateQuery,
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
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={dateQuery.end}
                            onChange={(e) =>
                              setDateQuery({
                                ...dateQuery,
                                end: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setPage(1)
                            setOpenCal(false)
                            refetch() // react-query refetch
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              )}
            </div>
          </div>
          {isLoadingNotifications || isLoading ? (
            <ProductClient data={[]} isLoading={true} />
          ) : (
            <ProductClient
              data={webhookNotifications?.data || []}
              isLoading={false}
            />
          )}
          <div className="flex justify-end gap-x-3">
            {/* <Button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              variant={page === 1 ? "ghost" : "default"}
            >
              Previous
            </Button>
            <Button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              variant={page === totalPages ? "ghost" : "default"}
            >
              Next
            </Button> */}

            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1 || isLoading || isLoadingNotifications}
                  variant={page === 1 ? 'ghost' : 'default'}
                >
                  Previous
                </Button>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  {/* First page */}
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

                  {/* Ellipsis if needed */}
                  {page > 4 && totalPages > 7 && (
                    <span className="px-1">...</span>
                  )}

                  {/* Middle pages */}
                  {Array.from(
                    { length: Math.min(6, totalPages - 2) },
                    (_, i) => {
                      let pageToShow: number

                      if (totalPages <= 8) {
                        // If we have 8 or fewer pages, show pages 2 through 7 (or fewer)
                        pageToShow = i + 2
                      } else if (page <= 4) {
                        // Near the start
                        pageToShow = i + 2
                      } else if (page >= totalPages - 3) {
                        // Near the end
                        pageToShow = totalPages - 7 + i
                      } else {
                        // Middle - center around current page
                        pageToShow = page - 2 + i
                      }

                      // Ensure page is within bounds and not the first or last page
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

                  {/* Ellipsis if needed */}
                  {page < totalPages - 3 && totalPages > 7 && (
                    <span className="px-1">...</span>
                  )}

                  {/* Last page */}
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
                    page === totalPages || isLoading || isLoadingNotifications
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

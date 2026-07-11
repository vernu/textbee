'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, RefreshCw, Smartphone, Timer } from 'lucide-react'
import { formatDeviceName } from '@/lib/utils'
import type { Device } from '@/lib/api'

const AUTO_REFRESH_INTERVALS = [
  { value: 0, label: 'Off' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
]

type FiltersBarProps = {
  devices: Device[]
  currentDevice: string
  onDeviceChange: (deviceId: string) => void
  messageType: string
  onMessageTypeChange: (type: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  autoRefreshInterval: number
  onAutoRefreshIntervalChange: (seconds: number) => void
}

// Device / message-type selectors plus refresh controls for the history list.
export default function FiltersBar({
  devices,
  currentDevice,
  onDeviceChange,
  messageType,
  onMessageTypeChange,
  onRefresh,
  isRefreshing,
  autoRefreshInterval,
  onAutoRefreshIntervalChange,
}: FiltersBarProps) {
  return (
    <div className='bg-card rounded-lg shadow-sm border border-border p-4 mb-4'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1.5'>
              <Smartphone className='h-3.5 w-3.5 text-primary' />
              <h3 className='text-sm font-medium text-foreground'>Device</h3>
            </div>
            <Select value={currentDevice} onValueChange={onDeviceChange}>
              <SelectTrigger className='w-full h-9 text-sm'>
                <SelectValue placeholder='Select a device' />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device._id} value={device._id}>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>
                        {formatDeviceName(device)}
                      </span>
                      {!device.enabled && (
                        <Badge variant='outline' className='ml-1 text-xs py-0 h-5'>
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='w-full sm:w-44'>
            <div className='flex items-center gap-2 mb-1.5'>
              <MessageSquare className='h-3.5 w-3.5 text-primary' />
              <h3 className='text-sm font-medium text-foreground'>
                Message Type
              </h3>
            </div>
            <Select value={messageType} onValueChange={onMessageTypeChange}>
              <SelectTrigger className='w-full h-9 text-sm'>
                <SelectValue placeholder='Message type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  <div className='flex items-center gap-1.5'>
                    <div className='h-1.5 w-1.5 rounded-full bg-muted-foreground'></div>
                    All Messages
                  </div>
                </SelectItem>
                <SelectItem value='received'>
                  <div className='flex items-center gap-1.5'>
                    <div className='h-1.5 w-1.5 rounded-full bg-green-500'></div>
                    Received
                  </div>
                </SelectItem>
                <SelectItem value='sent'>
                  <div className='flex items-center gap-1.5'>
                    <div className='h-1.5 w-1.5 rounded-full bg-brand-500'></div>
                    Sent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex items-center justify-between gap-2 pt-2 mt-2 border-t border-border'>
          <div className='flex items-center gap-1.5'>
            <Button
              onClick={onRefresh}
              variant='ghost'
              size='sm'
              disabled={!currentDevice}
              className='h-7 px-2 text-xs text-primary hover:bg-accent'
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh Now
            </Button>
          </div>

          <div className='flex items-center gap-1.5'>
            <Timer className='h-3 w-3 text-primary' />
            <span className='text-xs font-medium mr-1'>Auto Refresh:</span>
            <div className='flex'>
              {AUTO_REFRESH_INTERVALS.map((interval) => (
                <Button
                  key={interval.value}
                  size='sm'
                  variant='ghost'
                  disabled={!currentDevice && interval.value > 0}
                  className={`h-6 px-1.5 text-xs ${
                    autoRefreshInterval === interval.value
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/60'
                  }`}
                  onClick={() => onAutoRefreshIntervalChange(interval.value)}
                >
                  {interval.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

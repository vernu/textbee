// components/sms-modal.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  X,
  Calendar,
  MessageSquare,
  Phone,
  CreditCard,
  Bell,
} from 'lucide-react'

interface SmsData {
  _id: string
  createdAt: string
  device: string
  encrypted: boolean
  message: string
  receivedAt: string
  sender: string
  status: string
  type: string
  updatedAt: string
  __v: number
}

interface SmsModalProps {
  isOpen: boolean
  onClose: () => void
  smsData: SmsData | null
}

export function SmsModal({ isOpen, onClose, smsData }: SmsModalProps) {
  if (!smsData) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            Webhook Notification
          </DialogTitle>
        </DialogHeader>

        <h3 className="font-semibold text-sm flex items-center gap-2">
          Message Content
        </h3>
        <div className="space-y-4">
          {/* Message Content */}
          <div className="bg-muted/50 rounded-lg p-4 max-h-32 overflow-y-scroll scrollbar-hide">
            <p className="text-sm whitespace-pre-wrap">{smsData.message}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Sender
              </h3>
              <p className="text-sm bg-muted/30 rounded-md p-2">
                {smsData.sender}
              </p>
            </div>

            {/* Message Type */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Message Type</h3>
              <p className="text-sm bg-muted/30 rounded-md p-2 capitalize">
                {smsData.type.toLowerCase()}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Status</h3>
              <p className="text-sm bg-muted/30 rounded-md p-2 capitalize">
                {smsData.status}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-x-2">
                Created At
              </h3>
              <p className="text-sm bg-muted/30 rounded-md p-2 capitalize">
                {new Date(smsData.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  MessageSquare,
  Reply,
  Smartphone,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatTimestamp, getStatusBadge } from './utils'
import SmsComposerDialog from './sms-composer-dialog'
import type { SmsMessage } from './types'

type SmsDetailsDialogProps = {
  message: SmsMessage
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Full details for a single SMS, with reply (received) / follow-up (sent)
// actions that open the shared composer dialog.
export default function SmsDetailsDialog({
  message,
  open,
  onOpenChange,
}: SmsDetailsDialogProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)

  const statusBadge = getStatusBadge(message?.status)
  const isSent =
    !!message?.recipient || (message?.recipients && message.recipients.length > 0)
  const counterparty = isSent
    ? message.recipient || message.recipients?.[0] || 'Unknown'
    : message.sender || 'Unknown'

  const handleCopyMessage = () => {
    if (message?.message) {
      navigator.clipboard.writeText(message.message)
      toast({ title: 'Message copied to clipboard!' })
    }
  }

  const handleReplyClick = () => {
    onOpenChange(false)
    setIsReplyOpen(true)
  }

  const handleFollowUpClick = () => {
    onOpenChange(false)
    setIsFollowUpOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[550px] p-6'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-lg font-semibold'>
              <MessageSquare className='h-5 w-5 text-brand-500' />
              SMS Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this SMS message.
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4 space-y-4 text-sm'>
            {/* Info Grid - labels 1/3, values 2/3 */}
            <div className='grid grid-cols-[1fr_2fr] gap-x-6 gap-y-3'>
              <div className='font-medium text-muted-foreground'>Direction</div>
              <div className='flex items-center gap-1'>
                {isSent ? (
                  <ArrowUpRight className='h-4 w-4 text-brand-500' />
                ) : (
                  <ArrowDownLeft className='h-4 w-4 text-green-500' />
                )}
                <span className='capitalize'>{isSent ? 'Sent' : 'Received'}</span>
              </div>

              <div className='font-medium text-muted-foreground'>Number</div>
              <div>{counterparty}</div>

              <div className='font-medium text-muted-foreground'>Status</div>
              <div>
                <Badge
                  variant='outline'
                  className={`${statusBadge.color} flex items-center text-xs`}
                >
                  {statusBadge.icon}
                  {statusBadge.label}
                </Badge>
              </div>

              <div className='font-medium text-muted-foreground'>Date & Time</div>
              <div>
                {formatTimestamp(isSent ? message.requestedAt : message.receivedAt)}
              </div>

              <div className='font-medium text-muted-foreground'>Device</div>
              <div className='flex items-center gap-1'>
                <Smartphone className='h-3 w-3' />
                {message.device?.brand || 'N/A'} {message.device?.model || ''}
              </div>

              {message.gatewayMessageId && (
                <>
                  <div className='font-medium text-muted-foreground'>
                    Gateway ID
                  </div>
                  <div className='font-mono text-xs break-all min-w-0'>
                    {message.gatewayMessageId}
                  </div>
                </>
              )}
            </div>

            {/* Error details - full width, multi-line, contained */}
            {(message.errorCode || message.errorMessage) && (
              <div className='pt-3 border-t border-border space-y-2 min-w-0'>
                {message.errorCode && (
                  <div className='min-w-0'>
                    <div className='font-medium text-muted-foreground mb-0.5'>
                      Error code
                    </div>
                    <div
                      className='w-full min-w-0 max-h-24 overflow-y-auto overflow-x-hidden text-destructive text-sm break-words rounded p-2 bg-destructive/5'
                      title={message.errorCode}
                    >
                      {message.errorCode}
                    </div>
                  </div>
                )}
                {message.errorMessage && (
                  <div className='min-w-0'>
                    <div className='font-medium text-muted-foreground mb-0.5'>
                      Error message
                    </div>
                    <div
                      className='w-full min-w-0 max-h-32 overflow-y-auto overflow-x-hidden text-destructive text-sm break-words rounded p-2 bg-destructive/5'
                      title={message.errorMessage}
                    >
                      {message.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message Body */}
            <div className='pt-4 border-t border-border'>
              <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                Message Body
              </h4>
              <div className='max-h-48 overflow-y-auto p-2 bg-muted rounded-md text-sm break-words'>
                {message.message}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-wrap gap-2 mt-4 pt-2 border-t border-border'>
              {!isSent && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='gap-1'
                  onClick={handleReplyClick}
                >
                  <Reply className='h-4 w-4' />
                  Reply
                </Button>
              )}
              {isSent && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='gap-1'
                  onClick={handleFollowUpClick}
                >
                  <MessageSquare className='h-4 w-4' />
                  Follow Up
                </Button>
              )}
              <Button
                variant='ghost'
                size='sm'
                className='gap-1'
                onClick={handleCopyMessage}
              >
                <Copy className='h-4 w-4' />
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {message && isReplyOpen && (
        <SmsComposerDialog
          open={isReplyOpen}
          onOpenChange={setIsReplyOpen}
          title={`Reply to ${message.sender}`}
          description='Send a reply message to this sender.'
          icon={Reply}
          deviceId={message.device?._id}
          recipient={message.sender}
          submitLabel='Send Reply'
          successTitle='SMS sent successfully!'
          errorTitle='Failed to send SMS.'
        />
      )}
      {message && isFollowUpOpen && (
        <SmsComposerDialog
          open={isFollowUpOpen}
          onOpenChange={setIsFollowUpOpen}
          title={`Follow Up with ${counterparty}`}
          description='Send a follow-up message to this recipient.'
          icon={MessageSquare}
          deviceId={message.device?._id}
          recipient={message.recipient || message.recipients?.[0] || ''}
          submitLabel='Send Follow Up'
          successTitle='Follow-up SMS sent successfully!'
          errorTitle='Failed to send follow-up SMS.'
        />
      )}
    </>
  )
}

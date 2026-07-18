'use client'

import { useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  MessageSquare,
  Reply,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getStatusBadge } from './utils'
import { messageDate, messageDirection } from './group'
import { toExactLabel } from '@/components/shared/relative-time'
import SmsComposerDialog from './sms-composer-dialog'
import { cn } from '@/lib/utils'
import type { SmsMessage } from './types'

type SmsDetailsDialogProps = {
  message: SmsMessage
  open: boolean
  onOpenChange: (open: boolean) => void
  // The device whose history is open. The messages endpoint populates
  // `device`, but replying must still work if that is ever missing, otherwise
  // the composer opens with no device selected and cannot send.
  fallbackDeviceId?: string
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='grid grid-cols-[7rem_1fr] gap-x-4 py-1.5'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 break-words'>{children}</dd>
    </div>
  )
}

// Ordered by what people open this for: the message itself first, then the
// metadata that explains it.
export default function SmsDetailsDialog({
  message,
  open,
  onOpenChange,
  fallbackDeviceId,
}: SmsDetailsDialogProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)

  const statusBadge = getStatusBadge(message?.status)
  const isSent = messageDirection(message) === 'sent'
  const counterparty = isSent
    ? message.recipient || message.recipients?.[0] || 'Unknown'
    : message.sender || 'Unknown'
  const date = messageDate(message)
  const composerDeviceId = message.device?._id || fallbackDeviceId

  const handleCopyMessage = () => {
    if (message?.message) {
      navigator.clipboard.writeText(message.message)
      toast({ title: 'Message copied to clipboard!' })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[550px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base'>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  isSent
                    ? 'bg-primary/10 text-primary'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                )}
                aria-hidden
              >
                {isSent ? (
                  <ArrowUpRight className='h-4 w-4' />
                ) : (
                  <ArrowDownLeft className='h-4 w-4' />
                )}
              </span>
              <span className='min-w-0 truncate'>
                {isSent ? 'To' : 'From'} {counterparty}
              </span>
            </DialogTitle>
            {/* Exact time as text: the hover tooltip in the list is not
                reachable on touch. */}
            <DialogDescription>
              {date ? toExactLabel(date) : 'Date unknown'}
            </DialogDescription>
          </DialogHeader>

          {/* The message body leads: it is the reason this dialog is open. */}
          <div className='max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-sm'>
            {message.message}
          </div>

          <dl className='divide-y divide-border text-sm'>
            <Row label='Status'>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  statusBadge.color
                )}
              >
                {statusBadge.icon}
                {statusBadge.label}
              </span>
            </Row>
            <Row label='Direction'>{isSent ? 'Sent' : 'Received'}</Row>
            <Row label='Number'>{counterparty}</Row>
            <Row label='Device'>
              {message.device?.brand || message.device?.model
                ? `${message.device?.brand ?? ''} ${message.device?.model ?? ''}`.trim()
                : 'Not recorded'}
            </Row>
            {message.gatewayMessageId && (
              <Row label='Gateway ID'>
                <span className='font-mono text-xs'>
                  {message.gatewayMessageId}
                </span>
              </Row>
            )}
          </dl>

          {(message.errorCode || message.errorMessage) && (
            <div className='space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3'>
              <p className='text-sm font-medium text-destructive'>
                Delivery failed
              </p>
              {message.errorCode && (
                <p className='break-words text-xs text-destructive'>
                  Code: {message.errorCode}
                </p>
              )}
              {message.errorMessage && (
                <p className='max-h-24 overflow-y-auto break-words text-xs text-destructive'>
                  {message.errorMessage}
                </p>
              )}
            </div>
          )}

          <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              size='sm'
              className='w-full sm:w-auto'
              onClick={handleCopyMessage}
            >
              <Copy className='h-4 w-4' />
              Copy text
            </Button>
            {isSent ? (
              <Button
                size='sm'
                className='w-full sm:w-auto'
                onClick={() => {
                  onOpenChange(false)
                  setIsFollowUpOpen(true)
                }}
              >
                <MessageSquare className='h-4 w-4' />
                Follow up
              </Button>
            ) : (
              <Button
                size='sm'
                className='w-full sm:w-auto'
                onClick={() => {
                  onOpenChange(false)
                  setIsReplyOpen(true)
                }}
              >
                <Reply className='h-4 w-4' />
                Reply
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isReplyOpen && (
        <SmsComposerDialog
          open={isReplyOpen}
          onOpenChange={setIsReplyOpen}
          title={`Reply to ${counterparty}`}
          description='Send a reply to this sender.'
          icon={Reply}
          deviceId={composerDeviceId}
          recipient={message.sender}
          submitLabel='Send reply'
          successTitle='Reply sent'
          errorTitle='Could not send the reply'
        />
      )}
      {isFollowUpOpen && (
        <SmsComposerDialog
          open={isFollowUpOpen}
          onOpenChange={setIsFollowUpOpen}
          title={`Follow up with ${counterparty}`}
          description='Send another message to this recipient.'
          icon={MessageSquare}
          deviceId={composerDeviceId}
          recipient={message.recipient || message.recipients?.[0] || ''}
          submitLabel='Send follow up'
          successTitle='Follow up sent'
          errorTitle='Could not send the follow up'
        />
      )}
    </>
  )
}

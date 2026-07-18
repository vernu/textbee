'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import Papa from 'papaparse'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Send,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useMutation } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { formatError } from '@/lib/utils/errorHandler'
import { RateLimitError } from '@/components/shared/rate-limit-error'
import { formatDeviceName, cn } from '@/lib/utils'
import { useDevices, useSubscription } from '@/lib/api'
import { getSegmentInfo } from '@/lib/sms'
import StepShell from './step-shell'
import {
  buildRecipientPlan,
  detectRecipientColumn,
  extractTemplateVariables,
  findUnknownVariables,
  formatFileSize,
  renderTemplate,
  type CsvRow,
} from './bulk-csv'

const MAX_FILE_SIZE = 1024 * 1024 // 1 MB
const FALLBACK_MAX_ROWS = 50
const SAMPLE_CSV = '/samples/bulk-sms-sample.csv'
const PREVIEW_ROWS = 5

const REASON_LABEL: Record<string, string> = {
  empty: 'no phone number',
  invalid: 'not a valid phone number',
  duplicate: 'duplicate number',
}

export default function BulkSend() {
  const [rows, setRows] = useState<CsvRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [recipientColumn, setRecipientColumn] = useState('')
  const [template, setTemplate] = useState('')
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [simSubscriptionId, setSimSubscriptionId] = useState<number>()
  const [previewIndex, setPreviewIndex] = useState(0)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileWarning, setFileWarning] = useState<string | null>(null)
  const templateRef = useRef<HTMLTextAreaElement>(null)

  const { data: devices } = useDevices()
  const { data: subscription, isPending: subscriptionPending } =
    useSubscription()

  // Only enforce a row cap once the real limit is known. The old version
  // defaulted to 50 while the subscription was still loading, so an unlimited
  // plan could be told its file was too big.
  const maxRows = useMemo(() => {
    const limit =
      subscription?.usage?.bulkSendLimit ?? subscription?.plan?.bulkSendLimit
    if (subscriptionPending) return undefined
    if (limit === -1) return Number.POSITIVE_INFINITY
    return limit || FALLBACK_MAX_ROWS
  }, [subscription, subscriptionPending])

  const resetFile = () => {
    setRows([])
    setColumns([])
    setFileName(null)
    setRecipientColumn('')
    setPreviewIndex(0)
    setFileWarning(null)
  }

  // Derived rather than checked once at drop time. The subscription can still
  // be loading when a file lands, in which case maxRows is undefined and the
  // old imperative check was skipped entirely and never revisited, so an
  // over-cap file sailed through on a limited plan.
  const rowCapExceeded = maxRows !== undefined && rows.length > maxRows
  const rowCapUnknown = rows.length > 0 && maxRows === undefined

  const handleRecipientColumnChange = (value: string) => {
    setRecipientColumn(value)
    // plan.valid is rebuilt from the new column, so an index into the old
    // list can point past the end of the new one.
    setPreviewIndex(0)
  }

  const onDrop = useCallback((accepted: File[], rejections: FileRejection[]) => {
    const file = accepted[0]

    // react-dropzone still calls onDrop when every file was filtered out by
    // `accept`, so returning silently here left a rejected drop with no
    // feedback at all: nothing happened and nothing said why.
    if (!file) {
      const rejected = rejections[0]
      if (rejected) {
        setFileError(
          rejections.length > 1
            ? 'Please drop a single CSV file.'
            : `"${rejected.file.name}" is not a CSV. Export your spreadsheet as CSV and try again.`
        )
      }
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `That file is ${formatFileSize(file.size)}. The limit is ${formatFileSize(MAX_FILE_SIZE)}.`
      )
      return
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = (results.data ?? []).filter(Boolean)

        if (parsed.length === 0) {
          setFileError('That file has no rows. Check it has a header row.')
          resetFile()
          return
        }

        // Take the header papaparse actually parsed. Reading keys off the
        // first data row instead loses every column that row happened to
        // leave blank, because papaparse only assigns keys for values that
        // are present.
        const headers = (results.meta?.fields ?? []).filter(Boolean)

        if (headers.length === 0) {
          setFileError('That file has no header row, so columns cannot be mapped.')
          resetFile()
          return
        }

        setRows(parsed)
        setColumns(headers)
        setFileName(file.name)
        setRecipientColumn(detectRecipientColumn(headers) ?? '')
        setPreviewIndex(0)
        setFileError(null)

        // Row-level problems are reported here, not through `error`, which
        // only fires on a fatal stream failure. A mis-delimited file parses
        // "successfully" into one mangled column, so this is worth saying.
        const problems = results.errors ?? []
        setFileWarning(
          problems.length > 0
            ? `${problems.length} row${problems.length === 1 ? '' : 's'} did not parse cleanly (first problem on row ${
                (problems[0].row ?? 0) + 1
              }: ${problems[0].message}). Check the delimiter and quoting if the columns below look wrong.`
            : null
        )
      },
      error: () => setFileError('That file could not be read as CSV.'),
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const plan = useMemo(
    () =>
      recipientColumn
        ? buildRecipientPlan(rows, recipientColumn)
        : { valid: [], excluded: [], counts: null },
    [rows, recipientColumn]
  )

  const unknownVariables = useMemo(
    () => findUnknownVariables(template, columns),
    [template, columns]
  )

  const selectedDevice = devices?.find((d) => d._id === deviceId)
  const availableSims = Array.isArray((selectedDevice as any)?.simInfo?.sims)
    ? (selectedDevice as any).simInfo.sims
    : []

  // Clamped, so the preview can never be stranded past the end of a shorter
  // list. Anything that shrinks plan.valid (changing the phone column, most
  // obviously) would otherwise hide the preview and disable its own Next
  // button, leaving Previous as the only way back.
  const safePreviewIndex = Math.min(
    previewIndex,
    Math.max(0, plan.valid.length - 1)
  )
  const previewRow = plan.valid[safePreviewIndex]
  const previewMessage = previewRow
    ? renderTemplate(template, previewRow.data)
    : ''
  // Counted from the rendered message, never the raw template: falling back to
  // the template counts the literal "{{ name }}" placeholders and misstates
  // the segment cost.
  const segments = getSegmentInfo(previewMessage)

  const hasFile = rows.length > 0
  const mapped =
    hasFile &&
    !rowCapExceeded &&
    !rowCapUnknown &&
    Boolean(recipientColumn) &&
    plan.valid.length > 0
  const composed = mapped && template.trim().length > 0 && Boolean(deviceId)

  const {
    mutate: sendBulk,
    isPending: isSending,
    isSuccess,
    error: sendError,
    reset: resetSend,
  } = useMutation({
    mutationFn: async () => {
      // Only rows that survived validation are sent. The previous version
      // mapped every parsed row, including blanks and duplicates.
      const messages = plan.valid.map((row) => ({
        message: renderTemplate(template, row.data),
        recipients: [row.raw],
        ...(simSubscriptionId !== undefined && { simSubscriptionId }),
      }))

      return httpBrowserClient.post(
        ApiEndpoints.gateway.sendBulkSMS(deviceId!),
        { messageTemplate: template, messages }
      )
    },
  })

  const insertVariable = (column: string) => {
    const el = templateRef.current
    const token = `{{ ${column} }}`
    if (!el) {
      setTemplate((t) => t + token)
      return
    }
    const start = el.selectionStart ?? template.length
    const end = el.selectionEnd ?? template.length
    const next = template.slice(0, start) + token + template.slice(end)
    setTemplate(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  if (isSuccess) {
    return (
      <div className='rounded-xl border border-border bg-card p-8 text-center'>
        <div className='mx-auto mb-3 w-fit rounded-full bg-green-100 p-3 dark:bg-green-900/30'>
          <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
        </div>
        <h3 className='text-lg font-semibold'>
          {plan.valid.length.toLocaleString()} message
          {plan.valid.length === 1 ? '' : 's'} queued
        </h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          Delivery status appears in your message history as each one is sent.
        </p>
        <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
          <Button asChild size='sm'>
            <a href='/dashboard/messaging/history'>View message history</a>
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              resetSend()
              resetFile()
              setTemplate('')
            }}
          >
            Send another batch
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* 1. Upload */}
      <StepShell
        step={1}
        title='Upload your CSV'
        description='One row per recipient, with a header row'
        complete={hasFile}
      >
        {hasFile ? (
          <div className='space-y-3'>
            <div className='flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2'>
              <FileSpreadsheet className='h-4 w-4 shrink-0 text-primary' />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{fileName}</p>
                <p className='text-xs text-muted-foreground'>
                  {rows.length.toLocaleString()} rows, {columns.length} columns
                </p>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={resetFile}
                aria-label='Remove file'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            {/* Show what was actually parsed, so a mis-delimited file is
                obvious before anything is sent. */}
            <div className='overflow-x-auto rounded-lg border border-border'>
              <table className='w-full text-left text-xs'>
                <thead className='bg-muted/50'>
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className='whitespace-nowrap px-3 py-2 font-medium'>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td
                          key={c}
                          className='whitespace-nowrap px-3 py-1.5 text-muted-foreground'
                        >
                          {row[c] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > PREVIEW_ROWS && (
              <p className='text-xs text-muted-foreground'>
                Showing the first {PREVIEW_ROWS} of{' '}
                {rows.length.toLocaleString()} rows.
              </p>
            )}
          </div>
        ) : (
          <>
            <div
              {...getRootProps()}
              className={cn(
                'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors sm:p-8',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <input {...getInputProps()} />
              <Upload className='mx-auto h-8 w-8 text-muted-foreground' />
              <p className='mt-2 text-sm font-medium'>
                Drop a CSV here, or tap to choose one
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                Up to {formatFileSize(MAX_FILE_SIZE)}
                {maxRows !== undefined && maxRows !== Number.POSITIVE_INFINITY
                  ? ` and ${maxRows.toLocaleString()} rows on your plan`
                  : ''}
              </p>
            </div>

            <a
              href={SAMPLE_CSV}
              download
              className='inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline'
            >
              <Download className='h-3.5 w-3.5' />
              Download a sample CSV
            </a>
          </>
        )}

        {fileError && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>That file could not be used</AlertTitle>
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}

        {rowCapExceeded && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>That file is over your plan limit</AlertTitle>
            <AlertDescription>
              It has {rows.length.toLocaleString()} rows and your plan allows{' '}
              {maxRows!.toLocaleString()} per bulk send. Remove the extra rows
              or upgrade your plan.
            </AlertDescription>
          </Alert>
        )}

        {fileWarning && !fileError && (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Some rows did not parse cleanly</AlertTitle>
            <AlertDescription>{fileWarning}</AlertDescription>
          </Alert>
        )}
      </StepShell>

      {/* 2. Map */}
      <StepShell
        step={2}
        title='Choose the phone column and device'
        description='We guess the phone column from your headers'
        locked={!hasFile}
        complete={mapped && Boolean(deviceId)}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='recipient-column'>Phone number column</Label>
            <Select
              value={recipientColumn}
              onValueChange={handleRecipientColumnChange}
            >
              <SelectTrigger id='recipient-column'>
                <SelectValue placeholder='Select a column' />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='device-select'>Send from</Label>
            <Select
              value={deviceId ?? ''}
              onValueChange={(v) => {
                setDeviceId(v)
                setSimSubscriptionId(undefined)
              }}
            >
              <SelectTrigger id='device-select'>
                <SelectValue placeholder='Select a device' />
              </SelectTrigger>
              <SelectContent>
                {devices?.map((device) => (
                  <SelectItem
                    key={device._id}
                    value={device._id}
                    disabled={!device.enabled}
                  >
                    {formatDeviceName(device)}
                    {device.enabled ? '' : ' (disabled)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableSims.length > 1 && (
            <div className='space-y-1.5'>
              <Label htmlFor='sim-select'>SIM (optional)</Label>
              <Select
                value={simSubscriptionId?.toString() ?? ''}
                onValueChange={(v) =>
                  setSimSubscriptionId(v ? Number(v) : undefined)
                }
              >
                <SelectTrigger id='sim-select'>
                  <SelectValue placeholder='Default SIM' />
                </SelectTrigger>
                <SelectContent>
                  {availableSims.map((sim: any) => (
                    <SelectItem
                      key={sim.subscriptionId}
                      value={String(sim.subscriptionId)}
                    >
                      {sim.displayName || 'SIM'} ({sim.subscriptionId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {plan.counts && (
          <div className='flex flex-wrap gap-2 text-xs'>
            <span className='rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300'>
              {plan.counts.valid.toLocaleString()} will receive a message
            </span>
            {plan.counts.empty > 0 && (
              <span className='rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground'>
                {plan.counts.empty} with no number
              </span>
            )}
            {plan.counts.invalid > 0 && (
              <span className='rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'>
                {plan.counts.invalid} invalid
              </span>
            )}
            {plan.counts.duplicate > 0 && (
              <span className='rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'>
                {plan.counts.duplicate} duplicate
              </span>
            )}
          </div>
        )}

        {recipientColumn && plan.valid.length === 0 && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>No usable phone numbers</AlertTitle>
            <AlertDescription>
              No row in "{recipientColumn}" holds a valid phone number. Pick a
              different column.
            </AlertDescription>
          </Alert>
        )}
      </StepShell>

      {/* 3. Compose */}
      <StepShell
        step={3}
        title='Write your message'
        description='Insert a column to personalise each message'
        locked={!mapped || !deviceId}
        complete={composed}
      >
        {columns.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {columns.map((c) => (
              <button
                key={c}
                type='button'
                onClick={() => insertVariable(c)}
                className='rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-xs transition-colors hover:border-primary/50 hover:text-primary'
              >
                {`{{ ${c} }}`}
              </button>
            ))}
          </div>
        )}

        <div className='space-y-1.5'>
          <Label htmlFor='message-template'>Message template</Label>
          <Textarea
            id='message-template'
            ref={templateRef}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder='Hi {{ name }}, your order {{ order_id }} is confirmed. Total: ${{ total }}. Thanks for shopping with us!'
            className='min-h-28 font-mono text-sm'
          />
          <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
            <span>
              {segments.length} characters, {segments.segments} segment
              {segments.segments === 1 ? '' : 's'} ({segments.encoding})
            </span>
            {segments.segments > 1 && (
              <span className='text-amber-600 dark:text-amber-500'>
                Over {segments.perSegment} characters counts as multiple
                messages
              </span>
            )}
          </div>
        </div>

        {unknownVariables.length > 0 && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Unknown column reference</AlertTitle>
            <AlertDescription>
              Your CSV has no column named{' '}
              {unknownVariables.map((v) => `"${v}"`).join(', ')}. Those
              placeholders will render as empty text.
            </AlertDescription>
          </Alert>
        )}

        {previewRow && template && (
          <div className='space-y-2 rounded-lg border border-border bg-muted/30 p-3'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-xs font-medium text-muted-foreground'>
                Preview for {previewRow.raw}
              </p>
              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  aria-label='Previous recipient'
                  disabled={safePreviewIndex === 0}
                  onClick={() =>
                    setPreviewIndex(Math.max(0, safePreviewIndex - 1))
                  }
                >
                  <ChevronLeft className='h-3.5 w-3.5' />
                </Button>
                <span className='text-xs tabular-nums text-muted-foreground'>
                  {safePreviewIndex + 1} / {plan.valid.length}
                </span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  aria-label='Next recipient'
                  disabled={safePreviewIndex >= plan.valid.length - 1}
                  onClick={() =>
                    setPreviewIndex(
                      Math.min(plan.valid.length - 1, safePreviewIndex + 1)
                    )
                  }
                >
                  <ChevronRight className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
            <p className='whitespace-pre-wrap text-sm'>{previewMessage}</p>
          </div>
        )}
      </StepShell>

      {/* 4. Review and send */}
      <StepShell
        step={4}
        title='Review and send'
        description='Nothing is sent until you confirm'
        locked={!composed}
      >
        <div className='rounded-lg border border-border bg-muted/30 p-3 text-sm'>
          <p>
            Sending{' '}
            <strong>{plan.valid.length.toLocaleString()} messages</strong> from{' '}
            <strong>
              {selectedDevice ? formatDeviceName(selectedDevice) : 'your device'}
            </strong>
            .
          </p>
          {plan.excluded.length > 0 && (
            <details className='mt-2'>
              <summary className='cursor-pointer text-xs text-muted-foreground hover:text-foreground'>
                {plan.excluded.length} row
                {plan.excluded.length === 1 ? '' : 's'} skipped
              </summary>
              <ul className='mt-2 space-y-1 text-xs text-muted-foreground'>
                {plan.excluded.slice(0, 10).map((row) => (
                  <li key={`${row.rowNumber}-${row.reason}`}>
                    Row {row.rowNumber}
                    {row.raw ? ` ("${row.raw}")` : ''}:{' '}
                    {REASON_LABEL[row.reason]}
                  </li>
                ))}
                {plan.excluded.length > 10 && (
                  <li>and {plan.excluded.length - 10} more</li>
                )}
              </ul>
            </details>
          )}
        </div>

        {sendError &&
          (() => {
            const formatted = formatError(sendError)
            if (formatted.isRateLimit) {
              return (
                <RateLimitError
                  errorData={formatted.rateLimitData}
                  variant='alert'
                />
              )
            }
            return (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Could not send</AlertTitle>
                <AlertDescription>{formatted.message}</AlertDescription>
              </Alert>
            )
          })()}

        <Button
          className='w-full'
          disabled={!composed || isSending || plan.valid.length === 0}
          onClick={() => sendBulk()}
        >
          {isSending ? (
            <>
              <Spinner size='sm' className='mr-2 text-white dark:text-black' />
              Sending...
            </>
          ) : (
            <>
              <Send className='mr-2 h-4 w-4' />
              Send {plan.valid.length.toLocaleString()} message
              {plan.valid.length === 1 ? '' : 's'}
            </>
          )}
        </Button>
      </StepShell>
    </div>
  )
}

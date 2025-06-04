'use client'

import { useState, useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { Upload, Send, AlertCircle, CheckCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ApiEndpoints } from '@/config/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import httpBrowserClient from '@/lib/httpBrowserClient'

const DEFAULT_MAX_FILE_SIZE = 1024 * 1024 // 1 MB
const DEFAULT_MAX_ROWS = 50

export default function BulkSMSSend() {
  const [csvData, setCsvData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [messageTemplate, setMessageTemplate] = useState<string>('')
  const [selectedRecipient, setSelectedRecipient] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const {
    data: currentSubscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
  } = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.billing.currentSubscription())
        .then((res) => res.data),
  })

  const maxRows = useMemo(() => {
    if (currentSubscription?.plan?.bulkSendLimit == -1) {
      return 9999
    }

    return currentSubscription?.plan?.bulkSendLimit || DEFAULT_MAX_ROWS
  }, [currentSubscription])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file.size > DEFAULT_MAX_FILE_SIZE) {
      setError('File size exceeds 1 MB limit.')
      return
    }

    Papa.parse(file, {
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          if (results.data.length > maxRows) {
            setError(`CSV file exceeds ${maxRows} rows limit.`)
            return
          }
          setCsvData(results.data as any[])
          const headerRow = results.data[0] as Record<string, unknown>
          setColumns(Object.keys(headerRow))
          setError(null)
        } else {
          setError('CSV file is empty or invalid')
          setCsvData([])
          setColumns([])
        }
      },
      header: true,
      skipEmptyLines: true,
    })
  }, [maxRows])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const previewMessage = useMemo(() => {
    if (!selectedRecipient || !messageTemplate) return ''
    const recipient = csvData.find(
      (row) => row[selectedColumn] === selectedRecipient
    )
    if (!recipient) return ''

    return messageTemplate.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
      return recipient[key.trim()] || ''
    })
  }, [selectedRecipient, messageTemplate, csvData, selectedColumn])

  const handleSendBulkSMS = async () => {
    const messages = csvData.map((row) => ({
      message: messageTemplate.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
        return row[key.trim()] || ''
      }),
      recipients: [row[selectedColumn]],
    }))
    const payload = {
      messageTemplate,
      messages,
    }
    await httpBrowserClient.post(
      ApiEndpoints.gateway.sendBulkSMS(selectedDeviceId),
      payload
    )
  }

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.listDevices())
        .then((res) => res.data),
  })

  const {
    mutate: sendBulkSMS,
    isPending: isSendingBulkSMS,
    isSuccess: isSendingBulkSMSuccess,
    isError: isSendingBulkSMSError,
    error: sendingBulkSMSError,
  } = useMutation({
    mutationFn: handleSendBulkSMS,
  })

  const isStep2Disabled = csvData.length === 0
  const isStep3Disabled = isStep2Disabled || !selectedColumn || !messageTemplate

  return (
    <div className='space-y-8'>
      <Card>
        <CardHeader>
          <CardTitle>Send Bulk SMS</CardTitle>
          <CardDescription>
            Upload a CSV, configure your message, and send bulk SMS in 3 simple
            steps.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-8'>
          <section>
            <h2 className='text-lg font-semibold mb-2'>1. Upload CSV</h2>
            <p className='text-sm text-gray-500 mb-4'>
              Upload a CSV file (max {DEFAULT_MAX_FILE_SIZE} bytes, {maxRows}
              rows) containing recipient information.
            </p>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} accept='.csv' />
              <Upload className='mx-auto h-12 w-12 text-gray-400' />
              <p className='mt-2'>
                Drag &amp; drop a CSV file here, or click to select one
              </p>
              <p className='text-sm text-gray-500 mt-1'>
                Max file size: {DEFAULT_MAX_FILE_SIZE} bytes, Max rows:{' '}
                {maxRows}
              </p>
            </div>
            {error && (
              <Alert variant='destructive' className='mt-4'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {csvData.length > 0 && (
              <p className='mt-2 text-sm text-green-600'>
                CSV uploaded successfully! {csvData.length} rows found.
              </p>
            )}
          </section>

          <section
            className={isStep2Disabled ? 'opacity-50 pointer-events-none' : ''}
          >
            <h2 className='text-lg font-semibold mb-2'>2. Configure SMS</h2>
            <p className='text-sm text-gray-500 mb-4'>
              Select the recipient column and create your message template.
            </p>

            {/* select device to send SMS from   */}
            <div>
              <Label htmlFor='device-select'>Select Device</Label>
              <Select
                onValueChange={setSelectedDeviceId}
                value={selectedDeviceId}
              >
                <SelectTrigger id='device-select'>
                  <SelectValue placeholder='Select a device' />
                </SelectTrigger>
                <SelectContent>
                  {devices?.data?.map((device) => (
                    <SelectItem
                      key={device._id}
                      value={device._id}
                      disabled={!device.enabled}
                    >
                      {device.brand} - {device.model}{' '}
                      {device.enabled ? '' : ' (disabled)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-4'>
              <div>
                <Label htmlFor='recipient-column'>
                  Select Recipient Column
                </Label>
                <Select
                  onValueChange={setSelectedColumn}
                  value={selectedColumn}
                  disabled={isStep2Disabled}
                >
                  <SelectTrigger id='recipient-column'>
                    <SelectValue placeholder='Select a column' />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem
                        key={column}
                        value={column || 'undefined-column'}
                      >
                        {column || 'Unnamed Column'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='message-template'>Message Template</Label>
                <Textarea
                  id='message-template'
                  placeholder='Enter your message template here. Use {{ column_name }} for dynamic content.'
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className='h-32'
                  disabled={isStep2Disabled}
                />
              </div>
            </div>
          </section>

          <section
            className={isStep3Disabled ? 'opacity-50 pointer-events-none' : ''}
          >
            <h2 className='text-lg font-semibold mb-2'>3. Message Preview</h2>
            <p className='text-sm text-gray-500 mb-4'>
              Preview your message for a selected recipient before sending.
            </p>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='preview-recipient'>
                  Select Recipient for Preview
                </Label>
                <Select
                  onValueChange={setSelectedRecipient}
                  value={selectedRecipient}
                  disabled={isStep3Disabled}
                >
                  <SelectTrigger id='preview-recipient'>
                    <SelectValue placeholder='Select a recipient' />
                  </SelectTrigger>
                  <SelectContent>
                    {csvData
                      .map((row, index) => {
                        const value = row[selectedColumn]
                        if (value) {
                          return (
                            <SelectItem key={`${value}-${index}`} value={value}>
                              {value}
                            </SelectItem>
                          )
                        }
                        return null
                      })
                      .filter(Boolean)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='recipient-number'>Recipient Number</Label>
                <Input
                  id='recipient-number'
                  value={selectedRecipient}
                  disabled
                  //   className='bg-gray-100'
                />
              </div>
              <div>
                <Label htmlFor='message-preview'>Message Preview</Label>
                <Textarea
                  id='message-preview'
                  value={previewMessage}
                  disabled
                  className='p-4 rounded-md min-h-[100px] whitespace-pre-wrap'
                />
              </div>
            </div>
          </section>

          {sendingBulkSMSError && (
            <Alert variant='destructive' className='mt-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {sendingBulkSMSError?.message}
              </AlertDescription>
            </Alert>
          )}

          {isSendingBulkSMSuccess && (
            <Alert variant='default' className='mt-4'>
              <CheckCircle className='h-4 w-4' />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Bulk SMS sent successfully!</AlertDescription>
            </Alert>
          )}

          <Button
            className='w-full'
            disabled={isStep3Disabled || isSendingBulkSMS}
            onClick={() => sendBulkSMS()}
          >
            {isSendingBulkSMS ? (
              <Spinner size='sm' className='text-white dark:text-black' />
            ) : (
              <Send className='mr-2 h-4 w-4' />
            )}
            {isSendingBulkSMS ? 'Sending...' : 'Send Bulk SMS'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

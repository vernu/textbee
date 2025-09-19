'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { contactsApi, CsvPreview, ContactTemplate } from '@/lib/api/contacts'

interface CsvPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spreadsheetId: string
  fileName: string
  fileContent: string
  onProcessComplete: () => void
}

const CONTACT_FIELDS = [
  { value: 'firstName', label: 'First name' },
  { value: 'lastName', label: 'Last name' },
  { value: 'phone', label: 'Phone' },
  { value: '__dnc__', label: 'Do Not Call' },
  { value: 'email', label: 'Email' },
  { value: 'propertyAddress', label: 'Property address' },
  { value: 'propertyCity', label: 'Property city' },
  { value: 'propertyState', label: 'Property state' },
  { value: 'propertyZip', label: 'Property zip' },
  { value: 'parcelCounty', label: 'Parcel county' },
  { value: 'parcelState', label: 'Parcel state' },
  { value: 'parcelAcres', label: 'Parcel acres' },
  { value: 'apn', label: 'APN' },
  { value: 'mailingAddress', label: 'Mailing address' },
  { value: 'mailingCity', label: 'Mailing city' },
  { value: 'mailingState', label: 'Mailing state' },
  { value: 'mailingZip', label: 'Mailing zip' },
]

const REQUIRED_FIELDS = ['firstName', 'lastName', 'phone']

export default function CsvPreviewDialog({
  open,
  onOpenChange,
  spreadsheetId,
  fileName,
  fileContent,
  onProcessComplete,
}: CsvPreviewDialogProps) {
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null)
  const [templates, setTemplates] = useState<ContactTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [previewRows, setPreviewRows] = useState(10)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dncColumn, setDncColumn] = useState<string>('')
  const [dncValue, setDncValue] = useState<string>('')
  const [showDncWarning, setShowDncWarning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && fileContent) {
      loadPreview()
      loadTemplates()
    }
  }, [open, fileContent, previewRows])

  const loadPreview = async () => {
    try {
      setLoading(true)
      const preview = await contactsApi.previewCsv({
        fileContent,
        previewRows,
      })
      setCsvPreview(preview)
    } catch (error) {
      console.error('Error loading preview:', error)
      toast({
        title: 'Error',
        description: 'Failed to load CSV preview',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const templatesData = await contactsApi.getTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setColumnMapping(template.columnMapping)
      setDncColumn(template.dncColumn || '')
      setDncValue(template.dncValue || '')
      setSelectedTemplate(templateId)
    }
  }

  const handleColumnMappingChange = (csvColumn: string, contactField: string) => {
    if (contactField === '__dnc__') {
      // Handle DNC column selection
      setDncColumn(csvColumn)
      // Remove from regular column mapping
      setColumnMapping(prev => {
        const newMapping = { ...prev }
        delete newMapping[csvColumn]
        return newMapping
      })
    } else {
      // Handle regular field mapping
      setColumnMapping(prev => {
        const newMapping = { ...prev }
        if (contactField === '__not_mapped__') {
          delete newMapping[csvColumn]
        } else {
          newMapping[csvColumn] = contactField
        }
        return newMapping
      })
      // If this column was previously selected as DNC, clear DNC selection
      if (dncColumn === csvColumn) {
        setDncColumn('')
        setDncValue('')
      }
    }
  }

  const validateMapping = (): boolean => {
    const mappedFields = Object.values(columnMapping)
    const missingFields = REQUIRED_FIELDS.filter(field => !mappedFields.includes(field))

    if (missingFields.length > 0) {
      toast({
        title: 'Missing required fields',
        description: `Please map the following required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      return false
    }

    // Show warning if no DNC column is selected
    if (!dncColumn) {
      setShowDncWarning(true)
    }

    return true
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please enter a name for the template',
        variant: 'destructive',
      })
      return
    }

    if (!validateMapping()) return

    try {
      await contactsApi.createTemplate({
        name: newTemplateName.trim(),
        columnMapping,
        dncColumn: dncColumn || undefined,
        dncValue: dncValue || undefined,
      })

      toast({
        title: 'Template created',
        description: 'Template saved successfully',
      })

      await loadTemplates()
      setShowNewTemplate(false)
      setNewTemplateName('')
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      })
    }
  }

  const handleProcess = async () => {
    if (!validateMapping()) return

    // If DNC warning is showing and user hasn't dismissed it, don't proceed
    if (showDncWarning) {
      return
    }

    try {
      setProcessing(true)
      const result = await contactsApi.processSpreadsheet(spreadsheetId, {
        columnMapping,
        templateId: selectedTemplate || undefined,
        dncColumn: dncColumn || undefined,
        dncValue: dncValue || undefined,
      })

      const successParts = [`Processed ${result.processed} contacts`]
      if (result.skipped > 0) {
        successParts.push(`${result.skipped} duplicates skipped`)
      }
      if (result.errors.length > 0) {
        successParts.push(`${result.errors.length} errors`)
      }

      toast({
        title: 'Processing complete',
        description: successParts.join(', '),
      })

      // Show detailed duplicate information if there are any
      if (result.duplicateContacts.length > 0) {
        setTimeout(() => {
          toast({
            title: `${result.duplicateContacts.length} duplicate contacts skipped`,
            description: `Phone numbers already exist in your contacts. Use "View Details" button to see specifics.`,
            variant: 'default',
          })
        }, 1000)
      }

      onProcessComplete()
      onOpenChange(false)
    } catch (error) {
      console.error('Error processing spreadsheet:', error)
      toast({
        title: 'Processing failed',
        description: 'Failed to process contacts',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (!csvPreview) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {fileName}</DialogTitle>
          <DialogDescription>
            Map your CSV columns to contact fields. First name, last name, and phone are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Label>Template:</Label>
            <Select value={selectedTemplate} onValueChange={applyTemplate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewTemplate(!showNewTemplate)}
          >
            + New Template
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Label>Preview rows:</Label>
            <Select
              value={previewRows.toString()}
              onValueChange={(value) => setPreviewRows(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showNewTemplate && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Input
              placeholder="Template name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleCreateTemplate}>
              Save Template
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewTemplate(false)
                setNewTemplateName('')
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {dncColumn && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium">DNC Configuration</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Column: "{dncColumn}"</Label>
              <Label className="text-sm">Value indicating DNC:</Label>
              <Input
                placeholder="e.g., Yes, 1, True"
                value={dncValue}
                onChange={(e) => setDncValue(e.target.value)}
                className="w-32"
                size="sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contacts where "{dncColumn}" equals this value will be marked as Do Not Call
            </p>
          </div>
        )}

        {showDncWarning && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  No DNC Column Selected
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Consider mapping a column to "Do Not Call" to track contacts who should not be contacted.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDncWarning(false)}
                >
                  Continue Anyway
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDncWarning(false)}
                >
                  Got It
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-muted">
                {csvPreview.headers.map((header, index) => {
                  const isMapped = dncColumn === header || columnMapping[header]
                  return (
                    <th key={index} className={`border p-2 text-left min-w-[150px] ${isMapped ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                      <div className="space-y-2">
                        <div className="font-medium">
                          {header}
                        </div>
                      <Select
                        value={
                          dncColumn === header
                            ? '__dnc__'
                            : columnMapping[header] || '__not_mapped__'
                        }
                        onValueChange={(value) => handleColumnMappingChange(header, value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__not_mapped__">Not mapped</SelectItem>
                          {CONTACT_FIELDS.map((field) => (
                            <SelectItem
                              key={field.value}
                              value={field.value}
                              className={
                                REQUIRED_FIELDS.includes(field.value) ? 'font-semibold' : ''
                              }
                            >
                              {field.label}
                              {REQUIRED_FIELDS.includes(field.value) && ' *'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {csvPreview.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/25'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border p-2 text-sm">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {csvPreview.totalRows > previewRows && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Showing {previewRows} of {csvPreview.totalRows} total rows
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleProcess} disabled={processing}>
            {processing ? 'Processing...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
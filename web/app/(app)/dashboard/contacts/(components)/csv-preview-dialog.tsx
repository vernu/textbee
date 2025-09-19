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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, Trash2, X, Save, Copy, RotateCcw } from 'lucide-react'

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('__no_template__')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [previewRows, setPreviewRows] = useState(10)
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dncColumn, setDncColumn] = useState<string>('')
  const [dncValue, setDncValue] = useState<string>('')
  const [showDncWarning, setShowDncWarning] = useState(false)
  const [dncWarningDismissed, setDncWarningDismissed] = useState(false)
  const [originalTemplate, setOriginalTemplate] = useState<ContactTemplate | null>(null)
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false)
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false)
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (open && fileContent) {
      loadPreview()
      loadTemplates()
    }
  }, [open, fileContent, previewRows])

  useEffect(() => {
    if (originalTemplate && selectedTemplate !== '__no_template__') {
      const currentMapping = JSON.stringify(columnMapping)
      const originalMapping = JSON.stringify(originalTemplate.columnMapping)
      const currentDnc = JSON.stringify({ column: dncColumn, value: dncValue })
      const originalDnc = JSON.stringify({
        column: originalTemplate.dncColumn || '',
        value: originalTemplate.dncValue || ''
      })

      setHasTemplateChanges(currentMapping !== originalMapping || currentDnc !== originalDnc)
    } else {
      setHasTemplateChanges(false)
    }
  }, [columnMapping, dncColumn, dncValue, originalTemplate, selectedTemplate])

  useEffect(() => {
    // Reset dismissal state when a DNC column is selected
    if (dncColumn) {
      setDncWarningDismissed(false)
    }
  }, [dncColumn])

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
      setOriginalTemplate(template)
    } else {
      setOriginalTemplate(null)
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
      const missingFieldLabels = missingFields.map(field => {
        const contactField = CONTACT_FIELDS.find(f => f.value === field)
        return contactField ? contactField.label : field
      })

      toast({
        title: 'Missing required fields',
        description: `Please map the following required fields: ${missingFieldLabels.join(', ')}`,
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleClearColumnAssignments = () => {
    setColumnMapping({})
    setDncColumn('')
    setDncValue('')
  }

  const handleClearTemplate = () => {
    setColumnMapping({})
    setDncColumn('')
    setDncValue('')
    setSelectedTemplate('__no_template__')
    setOriginalTemplate(null)
  }

  const handleRevertChanges = () => {
    if (originalTemplate) {
      setColumnMapping(originalTemplate.columnMapping)
      setDncColumn(originalTemplate.dncColumn || '')
      setDncValue(originalTemplate.dncValue || '')
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      await contactsApi.deleteTemplate(templateToDelete)

      toast({
        title: 'Template deleted',
        description: 'Template deleted successfully',
      })

      await loadTemplates()

      // Clear selection if the deleted template was selected
      if (selectedTemplate === templateToDelete) {
        handleClearTemplate()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      })
    } finally {
      setShowDeleteConfirm(false)
      setTemplateToDelete('')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!originalTemplate) return
    if (!validateMapping()) return

    try {
      await contactsApi.updateTemplate(originalTemplate.id, {
        name: originalTemplate.name,
        columnMapping,
        dncColumn: dncColumn || undefined,
        dncValue: dncValue || undefined,
      })

      toast({
        title: 'Template updated',
        description: 'Changes saved to template successfully',
      })

      await loadTemplates()
      setOriginalTemplate(prev => prev ? {
        ...prev,
        columnMapping,
        dncColumn: dncColumn || undefined,
        dncValue: dncValue || undefined,
      } : null)
    } catch (error) {
      console.error('Error updating template:', error)
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      })
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!saveAsTemplateName.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please enter a name for the new template',
        variant: 'destructive',
      })
      return
    }

    if (!validateMapping()) return

    try {
      const newTemplate = await contactsApi.createTemplate({
        name: saveAsTemplateName.trim(),
        columnMapping,
        dncColumn: dncColumn || undefined,
        dncValue: dncValue || undefined,
      })

      toast({
        title: 'Template created',
        description: 'New template saved successfully',
      })

      await loadTemplates()
      setShowSaveAsTemplate(false)
      setSaveAsTemplateName('')

      // Switch to the new template
      setSelectedTemplate(newTemplate.id)
      setOriginalTemplate(newTemplate)
    } catch (error) {
      console.error('Error creating new template:', error)
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
    if (!dncColumn && !dncWarningDismissed) {
      return
    }

    try {
      setProcessing(true)
      const result = await contactsApi.processSpreadsheet(spreadsheetId, {
        columnMapping,
        templateId: selectedTemplate !== '__no_template__' ? selectedTemplate : undefined,
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {fileName}</DialogTitle>
          <DialogDescription>
            Map your CSV columns to contact fields. First name, last name, and phone are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Label>Template:</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value) => {
                if (value && value !== "__no_template__") {
                  applyTemplate(value)
                } else {
                  handleClearTemplate()
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__no_template__">No template selected</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {hasTemplateChanges && originalTemplate && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpdateTemplate}
                  className="h-8"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaveAsTemplate(true)}
                  className="h-8"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Save as
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRevertChanges}
                  className="h-8"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Revert changes
                </Button>
              </>
            )}

            {selectedTemplate === '__no_template__' && (Object.keys(columnMapping).length > 0 || dncColumn) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveAsTemplate(true)}
                className="h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                Save template as
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearColumnAssignments}
              className="h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Clear assignments
            </Button>

            {selectedTemplate && selectedTemplate !== '__no_template__' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTemplate(selectedTemplate)}
                className="h-8 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete template
              </Button>
            )}
          </div>

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




        {dncColumn && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium">DNC Configuration</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Contacts where "{dncColumn}" equals this value will be marked as Do Not Call</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Column "{dncColumn}" value indicating DNC:</Label>
              <Input
                placeholder="e.g., Yes, 1, True"
                value={dncValue}
                onChange={(e) => setDncValue(e.target.value)}
                className="w-32 bg-white dark:bg-white dark:text-black"
                size="sm"
              />
            </div>
          </div>
        )}

        {!dncColumn && !dncWarningDismissed && (
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
                  onClick={() => setDncWarningDismissed(true)}
                >
                  Continue Anyway
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
                  const isDncColumn = dncColumn === header
                  const isMapped = columnMapping[header]
                  const isNotMapped = !isDncColumn && !isMapped
                  const selectedValue = dncColumn === header ? '__dnc__' : columnMapping[header] || '__not_mapped__'

                  // Determine if selected field is required for bold styling
                  const isSelectedRequired = selectedValue !== '__not_mapped__' && selectedValue !== '__dnc__' && REQUIRED_FIELDS.includes(selectedValue)

                  let dropdownBgClass = ''
                  let dropdownTextClass = ''

                  if (isDncColumn) {
                    dropdownBgClass = 'bg-blue-50 dark:bg-blue-950'
                    dropdownTextClass = 'text-blue-800 dark:text-blue-200'
                  } else if (isNotMapped) {
                    dropdownBgClass = 'bg-yellow-50 dark:bg-yellow-950'
                    dropdownTextClass = 'text-yellow-800 dark:text-yellow-200'
                  } else if (isSelectedRequired) {
                    dropdownBgClass = 'bg-purple-50 dark:bg-purple-950'
                    dropdownTextClass = 'text-purple-800 dark:text-purple-200'
                  } else {
                    dropdownBgClass = 'bg-white dark:bg-white'
                    dropdownTextClass = 'text-black dark:text-black'
                  }

                  return (
                    <th key={index} className="border p-2 text-left min-w-[150px]">
                      <div className="space-y-2">
                        <div className="font-medium">
                          {header}
                        </div>
                      <Select
                        value={selectedValue}
                        onValueChange={(value) => handleColumnMappingChange(header, value)}
                      >
                        <SelectTrigger className={`h-8 ${dropdownBgClass} ${dropdownTextClass} ${isSelectedRequired ? 'font-semibold' : 'font-normal'}`}>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__not_mapped__" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200">Not mapped</SelectItem>
                          {CONTACT_FIELDS.map((field) => (
                            <SelectItem
                              key={field.value}
                              value={field.value}
                              className={
                                field.value === '__dnc__'
                                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200'
                                  : REQUIRED_FIELDS.includes(field.value)
                                    ? 'font-semibold bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200'
                                    : ''
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
                  {row.map((cell, cellIndex) => {
                    const header = csvPreview.headers[cellIndex]
                    const isDncColumn = dncColumn === header
                    const matchesDncValue = isDncColumn && dncValue && cell === dncValue

                    return (
                      <td
                        key={cellIndex}
                        className={`border p-2 text-sm ${matchesDncValue ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                      >
                        {cell}
                      </td>
                    )
                  })}
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete template '{templates.find(t => t.id === templateToDelete)?.name}'?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConfirm(false)
              setTemplateToDelete('')
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSaveAsTemplate} onOpenChange={(open) => {
        setShowSaveAsTemplate(open)
        if (!open) setSaveAsTemplateName('')
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Enter a name for your new template. This will save the current column mapping and DNC settings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Input
              id="template-name"
              placeholder="Enter template name"
              value={saveAsTemplateName}
              onChange={(e) => setSaveAsTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveAsTemplate()
                }
              }}
            />
          </div>
          <DialogFooter className="pt-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveAsTemplate(false)
                setSaveAsTemplateName('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
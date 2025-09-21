'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ContactSpreadsheet } from '@/lib/api/contacts'
import { Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ProcessingDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spreadsheet: ContactSpreadsheet | null
}

export default function ProcessingDetailsDialog({
  open,
  onOpenChange,
  spreadsheet,
}: ProcessingDetailsDialogProps) {
  if (!spreadsheet) return null

  const {
    originalFileName,
    processedCount = 0,
    skippedCount = 0,
    processingErrors = [],
    duplicateContacts = []
  } = spreadsheet

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Processing Details: {originalFileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-1">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700">New Contacts</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{processedCount}</div>
              <div className="text-sm text-green-600">contacts created</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-700">Skipped</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{skippedCount}</div>
              <div className="text-sm text-orange-600">duplicates found</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-700">Errors</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{processingErrors.length}</div>
              <div className="text-sm text-red-600">validation errors</div>
            </div>
          </div>

          {/* Duplicate Contacts Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Skipped Duplicate Contacts ({duplicateContacts.length})
            </h3>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-4 space-y-2">
                {duplicateContacts.length > 0 ? (
                  duplicateContacts.map((duplicate, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-md border border-orange-200"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {duplicate.firstName && duplicate.lastName
                            ? `${duplicate.firstName} ${duplicate.lastName}`
                            : 'Unknown Name'
                          }
                        </div>
                        <div className="text-sm text-gray-600">{duplicate.phone}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-orange-700 border-orange-300">
                          Duplicate
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {duplicate.reason}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No duplicate contacts were skipped
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Processing Errors Section */}
          {processingErrors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Processing Errors ({processingErrors.length})
              </h3>
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-4 space-y-2">
                  {processingErrors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 rounded-md border border-red-200 text-sm text-red-700"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* No Issues Message */}
          {duplicateContacts.length === 0 && processingErrors.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-700">Perfect Processing!</h3>
              <p className="text-gray-600">All contacts were processed successfully with no duplicates or errors.</p>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
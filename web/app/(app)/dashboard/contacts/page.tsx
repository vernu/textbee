'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  FileSpreadsheet,
} from 'lucide-react'
import { contactsApi, ContactSpreadsheet, downloadBlob } from '@/lib/api/contacts'

export default function ContactsPage() {
  const [selectedMode, setSelectedMode] = useState<'spreadsheets' | 'all' | 'deleted'>('spreadsheets')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayCount, setDisplayCount] = useState(25)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<ContactSpreadsheet[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // Load files on component mount and when sort/search changes
  useEffect(() => {
    loadSpreadsheets()
  }, [searchQuery, sortBy, displayCount, currentPage])

  const loadSpreadsheets = async () => {
    try {
      setLoading(true)
      const response = await contactsApi.getSpreadsheets({
        search: searchQuery || undefined,
        sortBy,
        limit: displayCount,
        page: currentPage,
      })
      setFiles(response.data)
    } catch (error) {
      console.error('Error loading spreadsheets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load contact spreadsheets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Use files directly since API handles filtering and sorting
  const filteredAndSortedFiles = files

  const [totalContacts, setTotalContacts] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)

  // Load stats separately
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const stats = await contactsApi.getStats()
      setTotalContacts(stats.totalContacts)
      setTotalFiles(stats.totalSpreadsheets)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(filteredAndSortedFiles.map(file => file.id))
    } else {
      setSelectedFiles([])
    }
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId])
    } else {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a CSV file',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploading(true)
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim() !== '')
          const contactCount = Math.max(0, lines.length - 1)
          
          // Convert to base64 for API
          const fileContent = btoa(text)
          
          await contactsApi.uploadSpreadsheet({
            originalFileName: file.name,
            fileContent,
            contactCount,
            fileSize: file.size,
          })
          
          toast({
            title: 'Success',
            description: 'Contact spreadsheet uploaded successfully',
          })
          
          // Reload data
          await loadSpreadsheets()
          await loadStats()
          
        } catch (error) {
          console.error('Upload error:', error)
          toast({
            title: 'Upload failed',
            description: 'Failed to upload contact spreadsheet',
            variant: 'destructive',
          })
        }
      }
      
      reader.readAsText(file)
      
    } catch (error) {
      console.error('File read error:', error)
      toast({
        title: 'Error',
        description: 'Failed to read file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) return

    try {
      if (selectedFiles.length === 1) {
        const blob = await contactsApi.downloadSpreadsheet(selectedFiles[0])
        const file = files.find(f => f.id === selectedFiles[0])
        if (file) {
          downloadBlob(blob, file.originalFileName)
        }
      } else {
        const blob = await contactsApi.downloadMultipleSpreadsheets(selectedFiles)
        downloadBlob(blob, `contacts-${selectedFiles.length}-files.zip`)
      }
      
      toast({
        title: 'Success',
        description: 'Files downloaded successfully',
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download failed',
        description: 'Failed to download files',
        variant: 'destructive',
      })
    }
  }

  const isAllSelected = selectedFiles.length === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0
  const isSomeSelected = selectedFiles.length > 0

  return (
    <div className='flex h-full'>
      {/* Sidebar */}
      <div className='w-64 border-r bg-background/50 p-4'>
        <div className='space-y-2'>
          <Button
            variant={selectedMode === 'spreadsheets' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm'
            onClick={() => setSelectedMode('spreadsheets')}
          >
            <FileSpreadsheet className='mr-2 h-4 w-4' />
            Contact spreadsheets ({totalFiles})
          </Button>
          <Button
            variant={selectedMode === 'all' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm opacity-50 cursor-not-allowed'
            disabled
          >
            <Users className='mr-2 h-4 w-4' />
            All contacts ({totalContacts.toLocaleString()})
          </Button>
          <Button
            variant={selectedMode === 'deleted' ? 'default' : 'ghost'}
            className='w-full justify-start text-sm opacity-50 cursor-not-allowed'
            disabled
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Deleted
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='border-b p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold'>
              {selectedMode === 'spreadsheets' && 'Contact spreadsheets'}
              {selectedMode === 'all' && 'All contacts'}
              {selectedMode === 'deleted' && 'Deleted'}
            </h2>
            <div className='relative w-80'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search contact files...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button 
                className='gap-2' 
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <Upload className='h-4 w-4' />
                {uploading ? 'Uploading...' : 'Upload contacts'}
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='.csv'
                onChange={handleFileUpload}
                className='hidden'
              />
              <div className='flex flex-col gap-1'>
                <label className='text-xs text-muted-foreground'>Sort by:</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='newest'>Newest</SelectItem>
                    <SelectItem value='oldest'>Oldest</SelectItem>
                    <SelectItem value='a-z'>A → Z</SelectItem>
                    <SelectItem value='z-a'>Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              {isSomeSelected && (
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>{selectedFiles.length} selected</Badge>
                  <Button 
                    size='sm' 
                    variant='outline' 
                    className='gap-2'
                    onClick={handleDownloadSelected}
                  >
                    <Download className='h-4 w-4' />
                    Download
                  </Button>
                </div>
              )}
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>Display:</span>
                <Select value={displayCount.toString()} onValueChange={(value) => setDisplayCount(parseInt(value))}>
                  <SelectTrigger className='w-20'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='25'>25</SelectItem>
                    <SelectItem value='100'>100</SelectItem>
                    <SelectItem value='250'>250</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Table or Empty State */}
        <div className='flex-1 overflow-auto'>
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-muted-foreground'>Loading...</div>
            </div>
          ) : totalFiles === 0 ? (
            <div className='flex flex-col items-center justify-center h-full py-16'>
              <FileSpreadsheet className='h-16 w-16 text-muted-foreground/50 mb-4' />
              <h3 className='text-lg font-semibold text-muted-foreground mb-2'>No contact spreadsheets</h3>
              <p className='text-sm text-muted-foreground mb-6 text-center max-w-md'>
                Upload your first CSV file to get started managing your contacts.
              </p>
              <Button className='gap-2' onClick={handleUploadClick}>
                <Upload className='h-4 w-4' />
                Upload contacts
              </Button>
            </div>
          ) : (
            <table className='w-full'>
              <thead className='border-b bg-muted/50'>
                <tr>
                  <th className='w-12 p-4'>
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className='text-left p-4 font-medium'>Group name</th>
                  <th className='text-left p-4 font-medium'>Contacts</th>
                  <th className='text-left p-4 font-medium'>Date created</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedFiles.map((file) => (
                  <tr key={file.id} className='border-b hover:bg-muted/25'>
                    <td className='p-4'>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                      />
                    </td>
                    <td className='p-4'>
                      <div className='flex items-center gap-2'>
                        <FileSpreadsheet className='h-4 w-4 text-muted-foreground' />
                        {file.originalFileName}
                      </div>
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      {file.contactCount.toLocaleString()}
                    </td>
                    <td className='p-4 text-muted-foreground'>
                      {file.uploadDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination - only show when there are files */}
        {totalFiles > 0 && (
          <div className='border-t p-4'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Showing 1-{Math.min(displayCount, totalFiles)} of {totalFiles} files
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                  Previous
                </Button>
                <span className='text-sm text-muted-foreground'>
                  Page {currentPage} of {Math.ceil(totalFiles / displayCount) || 1}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.min(Math.ceil(totalFiles / displayCount), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(totalFiles / displayCount)}
                >
                  Next
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
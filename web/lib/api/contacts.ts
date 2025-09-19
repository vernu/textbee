import httpBrowserClient from '@/lib/httpBrowserClient'

export interface ContactSpreadsheet {
  id: string
  originalFileName: string
  contactCount: number
  uploadDate: string
  fileSize: number
  status: string
  templateId?: string
  validContactsCount?: number
  nonDncCount?: number
  dncCount?: number
  processedCount?: number
  skippedCount?: number
  processingErrors?: string[]
  duplicateContacts?: Array<{
    phone: string
    firstName?: string
    lastName?: string
    reason: string
  }>
}

export interface GetSpreadsheetsParams {
  search?: string
  sortBy?: 'newest' | 'oldest' | 'a-z' | 'z-a'
  limit?: number
  page?: number
  includeDeleted?: boolean
}

export interface GetSpreadsheetsResponse {
  data: ContactSpreadsheet[]
  total: number
  totalContacts: number
}

export interface UploadSpreadsheetData {
  originalFileName: string
  fileContent: string
  contactCount: number
  fileSize: number
}

export interface CsvPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
}

export interface ContactTemplate {
  id: string
  name: string
  columnMapping: Record<string, string>
  dncColumn?: string
  dncValue?: string
  createdAt: string
}

export interface PreviewCsvData {
  fileContent: string
  previewRows?: number
}

export interface ProcessSpreadsheetData {
  columnMapping: Record<string, string>
  templateId?: string
  dncColumn?: string
  dncValue?: string
}

export interface ProcessSpreadsheetResponse {
  processed: number
  skipped: number
  errors: string[]
  duplicateContacts: Array<{
    phone: string
    firstName?: string
    lastName?: string
    reason: string
  }>
}

export interface CreateTemplateData {
  name: string
  columnMapping: Record<string, string>
  dncColumn?: string
  dncValue?: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  propertyAddress?: string
  propertyCity?: string
  propertyState?: string
  propertyZip?: string
  parcelCounty?: string
  parcelState?: string
  parcelAcres?: number
  apn?: string
  mailingAddress?: string
  mailingCity?: string
  mailingState?: string
  mailingZip?: string
  dnc?: boolean | null
  dncUpdatedAt?: string
}

export interface GetContactsParams {
  search?: string
  sortBy?: 'newest' | 'oldest' | 'firstName' | 'lastName' | 'phone' | 'email' | 'propertyAddress' | 'propertyCity' | 'propertyState'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  page?: number
  spreadsheetId?: string
}

export interface GetContactsResponse {
  data: Contact[]
  total: number
}

export const contactsApi = {
  async uploadSpreadsheet(data: UploadSpreadsheetData): Promise<ContactSpreadsheet> {
    const response = await httpBrowserClient.post('/contacts/spreadsheets', data)
    return response.data
  },

  async getSpreadsheets(params: GetSpreadsheetsParams = {}): Promise<GetSpreadsheetsResponse> {
    const response = await httpBrowserClient.get('/contacts/spreadsheets', { params })
    return response.data
  },

  async getSpreadsheet(id: string): Promise<ContactSpreadsheet & { fileContent: string }> {
    const response = await httpBrowserClient.get(`/contacts/spreadsheets/${id}`)
    return response.data
  },

  async deleteSpreadsheet(id: string): Promise<void> {
    await httpBrowserClient.delete(`/contacts/spreadsheets/${id}`)
  },

  async deleteMultipleSpreadsheets(ids: string[]): Promise<void> {
    await httpBrowserClient.post('/contacts/spreadsheets/delete-multiple', { ids })
  },

  async downloadSpreadsheet(id: string): Promise<Blob> {
    const response = await httpBrowserClient.get(`/contacts/spreadsheets/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  async downloadMultipleSpreadsheets(ids: string[]): Promise<Blob> {
    const response = await httpBrowserClient.post('/contacts/spreadsheets/download-multiple', 
      { ids },
      { responseType: 'blob' }
    )
    return response.data
  },

  async getStats(): Promise<{ totalContacts: number; totalSpreadsheets: number }> {
    const response = await httpBrowserClient.get('/contacts/stats')
    return response.data
  },

  async previewCsv(data: PreviewCsvData): Promise<CsvPreview> {
    const response = await httpBrowserClient.post('/contacts/spreadsheets/preview', data)
    return response.data
  },

  async processSpreadsheet(spreadsheetId: string, data: ProcessSpreadsheetData): Promise<ProcessSpreadsheetResponse> {
    const response = await httpBrowserClient.post(`/contacts/spreadsheets/${spreadsheetId}/process`, data)
    return response.data
  },

  async getTemplates(): Promise<ContactTemplate[]> {
    const response = await httpBrowserClient.get('/contacts/templates')
    return response.data
  },

  async createTemplate(data: CreateTemplateData): Promise<ContactTemplate> {
    const response = await httpBrowserClient.post('/contacts/templates', data)
    return response.data
  },

  async getTemplate(id: string): Promise<ContactTemplate> {
    const response = await httpBrowserClient.get(`/contacts/templates/${id}`)
    return response.data
  },

  async deleteTemplate(id: string): Promise<void> {
    await httpBrowserClient.delete(`/contacts/templates/${id}`)
  },

  async createContact(data: Partial<Contact> & { phone: string }): Promise<Contact> {
    const response = await httpBrowserClient.post('/contacts', data)
    return response.data
  },

  async getContacts(params: GetContactsParams = {}): Promise<GetContactsResponse> {
    const response = await httpBrowserClient.get('/contacts', { params })
    return response.data
  },

  async getContact(id: string): Promise<Contact> {
    const response = await httpBrowserClient.get(`/contacts/${id}`)
    return response.data
  },

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await httpBrowserClient.put(`/contacts/${id}`, data)
    return response.data
  },

  async deleteContact(id: string): Promise<void> {
    await httpBrowserClient.delete(`/contacts/${id}`)
  },

  async deleteMultipleContacts(ids: string[]): Promise<void> {
    await httpBrowserClient.post('/contacts/delete-multiple', { ids })
  },
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
import httpBrowserClient from '@/lib/httpBrowserClient'

export interface ContactSpreadsheet {
  id: string
  originalFileName: string
  contactCount: number
  uploadDate: string
  fileSize: number
  isDeleted: boolean
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

export const contactsApi = {
  async uploadSpreadsheet(data: UploadSpreadsheetData): Promise<ContactSpreadsheet> {
    const response = await httpBrowserClient.post('/contacts/spreadsheets', data)
    return response.data
  },

  async getSpreadsheets(params: GetSpreadsheetsParams = {}): Promise<GetSpreadsheetsResponse> {
    const response = await httpBrowserClient.get('/contacts/spreadsheets', { params })
    return response.data
  },

  async getSpreadsheet(id: string): Promise<ContactSpreadsheet> {
    const response = await httpBrowserClient.get(`/contacts/spreadsheets/${id}`)
    return response.data
  },

  async deleteSpreadsheet(id: string): Promise<void> {
    await httpBrowserClient.delete(`/contacts/spreadsheets/${id}`)
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
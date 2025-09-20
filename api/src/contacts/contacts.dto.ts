import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UploadSpreadsheetDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  originalFileName: string

  @ApiProperty({ description: 'Base64 encoded file content' })
  @IsString()
  fileContent: string

  @ApiProperty({ description: 'Number of contacts in the file' })
  contactCount: number

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number
}

export class PreviewCsvDto {
  @ApiProperty({ description: 'Base64 encoded file content' })
  @IsString()
  fileContent: string

  @ApiProperty({ description: 'Number of rows to preview', required: false })
  @IsOptional()
  @IsNumber()
  previewRows?: number
}

export class ProcessSpreadsheetDto {
  @ApiProperty({ description: 'Column mapping from CSV headers to contact fields' })
  @IsObject()
  columnMapping: Record<string, string>

  @ApiProperty({ description: 'Template ID to save mapping as', required: false })
  @IsOptional()
  @IsString()
  templateId?: string

  @ApiProperty({ description: 'DNC column name if specified', required: false })
  @IsOptional()
  @IsString()
  dncColumn?: string

  @ApiProperty({ description: 'Value that indicates DNC is true', required: false })
  @IsOptional()
  @IsString()
  dncValue?: string
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Column mapping from CSV headers to contact fields' })
  @IsObject()
  columnMapping: Record<string, string>

  @ApiProperty({ description: 'DNC column name if specified', required: false })
  @IsOptional()
  @IsString()
  dncColumn?: string

  @ApiProperty({ description: 'Value that indicates DNC is true', required: false })
  @IsOptional()
  @IsString()
  dncValue?: string
}

export class CreateContactDto {
  @ApiProperty({ description: 'First name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiProperty({ description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone: string

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsString()
  email?: string

  @ApiProperty({ description: 'Property address', required: false })
  @IsOptional()
  @IsString()
  propertyAddress?: string

  @ApiProperty({ description: 'Property city', required: false })
  @IsOptional()
  @IsString()
  propertyCity?: string

  @ApiProperty({ description: 'Property state', required: false })
  @IsOptional()
  @IsString()
  propertyState?: string

  @ApiProperty({ description: 'Property zip', required: false })
  @IsOptional()
  @IsString()
  propertyZip?: string

  @ApiProperty({ description: 'Parcel county', required: false })
  @IsOptional()
  @IsString()
  parcelCounty?: string

  @ApiProperty({ description: 'Parcel state', required: false })
  @IsOptional()
  @IsString()
  parcelState?: string

  @ApiProperty({ description: 'Parcel acres', required: false })
  @IsOptional()
  @IsNumber()
  parcelAcres?: number

  @ApiProperty({ description: 'APN', required: false })
  @IsOptional()
  @IsString()
  apn?: string

  @ApiProperty({ description: 'Mailing address', required: false })
  @IsOptional()
  @IsString()
  mailingAddress?: string

  @ApiProperty({ description: 'Mailing city', required: false })
  @IsOptional()
  @IsString()
  mailingCity?: string

  @ApiProperty({ description: 'Mailing state', required: false })
  @IsOptional()
  @IsString()
  mailingState?: string

  @ApiProperty({ description: 'Mailing zip', required: false })
  @IsOptional()
  @IsString()
  mailingZip?: string

  @ApiProperty({ description: 'Do Not Call flag', required: false })
  @IsOptional()
  @IsBoolean()
  dnc?: boolean
}

export class UpdateContactDto {
  @ApiProperty({ description: 'First name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiProperty({ description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsString()
  email?: string

  @ApiProperty({ description: 'Property address', required: false })
  @IsOptional()
  @IsString()
  propertyAddress?: string

  @ApiProperty({ description: 'Property city', required: false })
  @IsOptional()
  @IsString()
  propertyCity?: string

  @ApiProperty({ description: 'Property state', required: false })
  @IsOptional()
  @IsString()
  propertyState?: string

  @ApiProperty({ description: 'Property zip', required: false })
  @IsOptional()
  @IsString()
  propertyZip?: string

  @ApiProperty({ description: 'Parcel county', required: false })
  @IsOptional()
  @IsString()
  parcelCounty?: string

  @ApiProperty({ description: 'Parcel state', required: false })
  @IsOptional()
  @IsString()
  parcelState?: string

  @ApiProperty({ description: 'Parcel acres', required: false })
  @IsOptional()
  @IsNumber()
  parcelAcres?: number

  @ApiProperty({ description: 'APN', required: false })
  @IsOptional()
  @IsString()
  apn?: string

  @ApiProperty({ description: 'Mailing address', required: false })
  @IsOptional()
  @IsString()
  mailingAddress?: string

  @ApiProperty({ description: 'Mailing city', required: false })
  @IsOptional()
  @IsString()
  mailingCity?: string

  @ApiProperty({ description: 'Mailing state', required: false })
  @IsOptional()
  @IsString()
  mailingState?: string

  @ApiProperty({ description: 'Mailing zip', required: false })
  @IsOptional()
  @IsString()
  mailingZip?: string

  @ApiProperty({ description: 'Do Not Call flag', required: false })
  @IsOptional()
  @IsBoolean()
  dnc?: boolean
}

export class GetContactsDto {
  @ApiProperty({ description: 'Search query for contact names or phone', required: false })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({ description: 'Sort field', required: false, enum: ['newest', 'oldest', 'firstName', 'lastName', 'phone', 'email', 'propertyAddress', 'propertyCity', 'propertyState'] })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'firstName', 'lastName', 'phone', 'email', 'propertyAddress', 'propertyCity', 'propertyState'])
  sortBy?: 'newest' | 'oldest' | 'firstName' | 'lastName' | 'phone' | 'email' | 'propertyAddress' | 'propertyCity' | 'propertyState'

  @ApiProperty({ description: 'Sort order', required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'

  @ApiProperty({ description: 'Number of items per page', required: false })
  @IsOptional()
  limit?: number

  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  page?: number

  @ApiProperty({ description: 'Filter by spreadsheet ID', required: false })
  @IsOptional()
  @IsString()
  spreadsheetId?: string
}

export class GetSpreadsheetsDto {
  @ApiProperty({ description: 'Search query for file names', required: false })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({ description: 'Sort order', required: false, enum: ['newest', 'oldest', 'a-z', 'z-a'] })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'a-z', 'z-a'])
  sortBy?: 'newest' | 'oldest' | 'a-z' | 'z-a'

  @ApiProperty({ description: 'Number of items per page', required: false })
  @IsOptional()
  limit?: number

  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  page?: number

  @ApiProperty({ description: 'Include deleted files', required: false })
  @IsOptional()
  includeDeleted?: boolean
}

export class ContactSpreadsheetResponseDto {
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

export class ContactTemplateResponseDto {
  id: string
  name: string
  columnMapping: Record<string, string>
  dncColumn?: string
  dncValue?: string
  createdAt: string
}

export class CsvPreviewResponseDto {
  headers: string[]
  rows: string[][]
  totalRows: number
}

export class ProcessSpreadsheetResponseDto {
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

export class ContactResponseDto {
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
  dnc?: boolean
  dncUpdatedAt?: string
  spreadsheetName?: string
}
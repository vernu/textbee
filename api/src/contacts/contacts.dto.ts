import { IsString, IsOptional, IsEnum } from 'class-validator'
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
  isDeleted: boolean
}
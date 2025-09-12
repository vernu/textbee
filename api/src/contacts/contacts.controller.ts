import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Response,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ContactsService } from './contacts.service'
import { UploadSpreadsheetDto, GetSpreadsheetsDto } from './contacts.dto'
import { Response as ExpressResponse } from 'express'

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post('spreadsheets')
  @ApiOperation({ summary: 'Upload a contact spreadsheet' })
  async uploadSpreadsheet(
    @Request() req,
    @Body() uploadData: UploadSpreadsheetDto,
  ) {
    return this.contactsService.uploadSpreadsheet(req.user.id, uploadData)
  }

  @Get('spreadsheets')
  @ApiOperation({ summary: 'Get user contact spreadsheets' })
  async getSpreadsheets(
    @Request() req,
    @Query() query: GetSpreadsheetsDto,
  ) {
    return this.contactsService.getSpreadsheets(req.user.id, query)
  }

  @Get('spreadsheets/:id')
  @ApiOperation({ summary: 'Get a specific contact spreadsheet' })
  async getSpreadsheet(
    @Request() req,
    @Param('id') id: string,
  ) {
    const spreadsheet = await this.contactsService.getSpreadsheetById(req.user.id, id)
    return {
      id: spreadsheet._id.toString(),
      originalFileName: spreadsheet.originalFileName,
      contactCount: spreadsheet.contactCount,
      uploadDate: spreadsheet.uploadDate.toISOString().split('T')[0],
      fileSize: spreadsheet.fileSize,
      isDeleted: spreadsheet.isDeleted,
    }
  }

  @Delete('spreadsheets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact spreadsheet' })
  async deleteSpreadsheet(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.contactsService.deleteSpreadsheet(req.user.id, id)
  }

  @Get('spreadsheets/:id/download')
  @ApiOperation({ summary: 'Download a contact spreadsheet' })
  async downloadSpreadsheet(
    @Request() req,
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const { fileName, content } = await this.contactsService.downloadSpreadsheet(
      req.user.id,
      id,
    )

    // Decode base64 content
    const csvContent = Buffer.from(content, 'base64').toString('utf-8')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(csvContent)
  }

  @Post('spreadsheets/download-multiple')
  @ApiOperation({ summary: 'Download multiple contact spreadsheets as ZIP' })
  async downloadMultipleSpreadsheets(
    @Request() req,
    @Body('ids') ids: string[],
    @Response() res: ExpressResponse,
  ) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No spreadsheet IDs provided')
    }

    const spreadsheets = await this.contactsService.downloadMultipleSpreadsheets(
      req.user.id,
      ids,
    )

    // For now, we'll return the first file. In production, you'd want to create a ZIP
    if (spreadsheets.length === 1) {
      const { fileName, content } = spreadsheets[0]
      const csvContent = Buffer.from(content, 'base64').toString('utf-8')
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.send(csvContent)
    } else {
      // TODO: Implement ZIP creation for multiple files
      throw new BadRequestException('Multiple file download not yet implemented')
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get contact statistics' })
  async getStats(@Request() req) {
    const { totalContacts } = await this.contactsService.getSpreadsheets(req.user.id, {})
    const { total: totalSpreadsheets } = await this.contactsService.getSpreadsheets(req.user.id, {})
    
    return {
      totalContacts,
      totalSpreadsheets,
    }
  }
}
import {
  Controller,
  Get,
  Post,
  Put,
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
import {
  UploadSpreadsheetDto,
  GetSpreadsheetsDto,
  PreviewCsvDto,
  ProcessSpreadsheetDto,
  ProcessSpreadsheetResponseDto,
  CreateTemplateDto,
  GetContactsDto,
  UpdateContactDto,
  CreateContactDto
} from './contacts.dto'
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
      status: spreadsheet.status,
      fileContent: spreadsheet.fileContent,
      templateId: spreadsheet.templateId?.toString(),
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

  @Post('spreadsheets/delete-multiple')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete multiple contact spreadsheets' })
  async deleteMultipleSpreadsheets(
    @Request() req,
    @Body('ids') ids: string[],
  ) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No spreadsheet IDs provided')
    }
    return this.contactsService.deleteMultipleSpreadsheets(req.user.id, ids)
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

  @Post('spreadsheets/preview')
  @ApiOperation({ summary: 'Preview CSV file content' })
  async previewCsv(
    @Request() req,
    @Body() previewData: PreviewCsvDto,
  ) {
    return this.contactsService.previewCsv(previewData)
  }

  @Post('spreadsheets/:id/process')
  @ApiOperation({ summary: 'Process uploaded spreadsheet with column mapping' })
  async processSpreadsheet(
    @Request() req,
    @Param('id') id: string,
    @Body() processData: ProcessSpreadsheetDto,
  ): Promise<ProcessSpreadsheetResponseDto> {
    return this.contactsService.processSpreadsheet(req.user.id, id, processData)
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get user contact templates' })
  async getTemplates(@Request() req) {
    return this.contactsService.getTemplates(req.user.id)
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a new contact template' })
  async createTemplate(
    @Request() req,
    @Body() templateData: CreateTemplateDto,
  ) {
    return this.contactsService.createTemplate(req.user.id, templateData)
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a specific template' })
  async getTemplate(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.contactsService.getTemplateById(req.user.id, id)
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template' })
  async deleteTemplate(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.contactsService.deleteTemplate(req.user.id, id)
  }

  @Post('')
  @ApiOperation({ summary: 'Create a new contact' })
  async createContact(
    @Request() req,
    @Body() createData: CreateContactDto,
  ) {
    return this.contactsService.createContact(req.user.id, createData)
  }

  @Get('')
  @ApiOperation({ summary: 'Get individual contacts' })
  async getContacts(
    @Request() req,
    @Query() query: GetContactsDto,
  ) {
    return this.contactsService.getContacts(req.user.id, query)
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific contact by ID' })
  async getContact(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.contactsService.getContactById(req.user.id, id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a contact' })
  async updateContact(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: UpdateContactDto,
  ) {
    return this.contactsService.updateContact(req.user.id, id, updateData)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact' })
  async deleteContact(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.contactsService.deleteContact(req.user.id, id)
  }

  @Post('delete-multiple')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete multiple contacts' })
  async deleteMultipleContacts(
    @Request() req,
    @Body('ids') ids: string[],
  ) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No contact IDs provided')
    }
    return this.contactsService.deleteMultipleContacts(req.user.id, ids)
  }
}
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
import { normalizePhoneNumber } from './utils/phone.utils'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { ContactSpreadsheet, ContactSpreadsheetDocument } from './schemas/contact-spreadsheet.schema'
import { Contact, ContactDocument } from './schemas/contact.schema'
import { ContactTemplate, ContactTemplateDocument } from './schemas/contact-template.schema'
import {
  UploadSpreadsheetDto,
  GetSpreadsheetsDto,
  ContactSpreadsheetResponseDto,
  PreviewCsvDto,
  CsvPreviewResponseDto,
  ProcessSpreadsheetDto,
  ProcessSpreadsheetResponseDto,
  CreateTemplateDto,
  ContactTemplateResponseDto,
  GetContactsDto,
  ContactResponseDto,
  UpdateContactDto,
  CreateContactDto
} from './contacts.dto'

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(ContactSpreadsheet.name)
    private contactSpreadsheetModel: Model<ContactSpreadsheetDocument>,
    @InjectModel(Contact.name)
    private contactModel: Model<ContactDocument>,
    @InjectModel(ContactTemplate.name)
    private contactTemplateModel: Model<ContactTemplateDocument>,
  ) {}

  async uploadSpreadsheet(
    userId: string,
    uploadData: UploadSpreadsheetDto,
  ): Promise<ContactSpreadsheetResponseDto> {
    // Generate unique filename by checking for existing files
    const uniqueFileName = await this.generateUniqueFileName(userId, uploadData.originalFileName)

    const contactSpreadsheet = new this.contactSpreadsheetModel({
      userId: new Types.ObjectId(userId),
      originalFileName: uniqueFileName,
      contactCount: uploadData.contactCount,
      uploadDate: new Date(),
      fileContent: uploadData.fileContent,
      fileSize: uploadData.fileSize,
      isDeleted: false,
    })

    const savedSpreadsheet = await contactSpreadsheet.save()
    // For newly uploaded spreadsheets, stats will be 0 until processed
    const stats = { validContactsCount: 0, nonDncCount: 0, dncCount: 0 }
    return this.mapToResponseDto(savedSpreadsheet, stats)
  }

  async getSpreadsheets(
    userId: string,
    query: GetSpreadsheetsDto,
  ): Promise<{ data: ContactSpreadsheetResponseDto[]; total: number; totalContacts: number }> {
    const {
      search,
      sortBy = 'newest',
      limit = 25,
      page = 1,
      includeDeleted = false,
    } = query

    // Build filter
    const filter: any = { userId: new Types.ObjectId(userId) }

    if (search) {
      filter.originalFileName = { $regex: search, $options: 'i' }
    }

    // Build sort
    const sort: any = {}
    switch (sortBy) {
      case 'newest':
        sort.uploadDate = -1
        break
      case 'oldest':
        sort.uploadDate = 1
        break
      case 'a-z':
        sort.originalFileName = 1
        break
      case 'z-a':
        sort.originalFileName = -1
        break
    }

    // Execute queries
    const [spreadsheets, total] = await Promise.all([
      this.contactSpreadsheetModel
        .find(filter)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .exec(),
      this.contactSpreadsheetModel.countDocuments(filter).exec(),
    ])

    // Calculate total actual contacts (processed individual contacts, not CSV row count)
    const totalContacts = await this.contactModel
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec()

    // Calculate DNC statistics for each spreadsheet
    const spreadsheetsWithStats = await Promise.all(
      spreadsheets.map(async (spreadsheet) => {
        const stats = await this.calculateSpreadsheetStats(userId, spreadsheet._id.toString())
        return this.mapToResponseDto(spreadsheet, stats)
      })
    )

    return {
      data: spreadsheetsWithStats,
      total,
      totalContacts,
    }
  }

  async getSpreadsheetById(
    userId: string,
    spreadsheetId: string,
  ): Promise<ContactSpreadsheetDocument> {
    const spreadsheet = await this.contactSpreadsheetModel
      .findOne({
        _id: new Types.ObjectId(spreadsheetId),
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (!spreadsheet) {
      throw new NotFoundException('Contact spreadsheet not found')
    }

    return spreadsheet
  }

  async deleteSpreadsheet(userId: string, spreadsheetId: string): Promise<void> {
    const spreadsheet = await this.contactSpreadsheetModel
      .findOne({
        _id: new Types.ObjectId(spreadsheetId),
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (!spreadsheet) {
      throw new NotFoundException('Contact spreadsheet not found')
    }

    // Delete all contacts associated with this spreadsheet
    await this.contactModel.deleteMany({
      spreadsheetId: new Types.ObjectId(spreadsheetId),
      userId: new Types.ObjectId(userId),
    }).exec()

    // Delete the spreadsheet itself
    await spreadsheet.deleteOne()
  }

  async deleteMultipleSpreadsheets(userId: string, spreadsheetIds: string[]): Promise<void> {
    const objectIds = spreadsheetIds.map(id => new Types.ObjectId(id))
    
    // Verify all spreadsheets belong to the user
    const spreadsheets = await this.contactSpreadsheetModel
      .find({
        _id: { $in: objectIds },
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (spreadsheets.length !== spreadsheetIds.length) {
      throw new NotFoundException('One or more spreadsheets not found')
    }

    // Delete all contacts associated with these spreadsheets
    await this.contactModel.deleteMany({
      spreadsheetId: { $in: objectIds },
      userId: new Types.ObjectId(userId),
    }).exec()

    // Delete all spreadsheets
    await this.contactSpreadsheetModel.deleteMany({
      _id: { $in: objectIds },
      userId: new Types.ObjectId(userId),
    }).exec()
  }

  async downloadSpreadsheet(
    userId: string,
    spreadsheetId: string,
  ): Promise<{ fileName: string; content: string }> {
    const spreadsheet = await this.getSpreadsheetById(userId, spreadsheetId)
    
    return {
      fileName: spreadsheet.originalFileName,
      content: spreadsheet.fileContent,
    }
  }

  async downloadMultipleSpreadsheets(
    userId: string,
    spreadsheetIds: string[],
  ): Promise<{ fileName: string; content: string }[]> {
    const spreadsheets = await this.contactSpreadsheetModel
      .find({
        _id: { $in: spreadsheetIds.map(id => new Types.ObjectId(id)) },
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (spreadsheets.length !== spreadsheetIds.length) {
      throw new NotFoundException('One or more contact spreadsheets not found')
    }

    return spreadsheets.map(spreadsheet => ({
      fileName: spreadsheet.originalFileName,
      content: spreadsheet.fileContent,
    }))
  }

  async previewCsv(previewData: PreviewCsvDto): Promise<CsvPreviewResponseDto> {
    const { fileContent, previewRows = 10 } = previewData
    
    try {
      const csvContent = Buffer.from(fileContent, 'base64').toString('utf-8')
      const lines = csvContent.split('\n').filter(line => line.trim() !== '')
      
      if (lines.length === 0) {
        throw new BadRequestException('CSV file is empty')
      }

      const headers = this.parseCsvRow(lines[0])
      const rows = lines.slice(1, Math.min(previewRows + 1, lines.length))
        .map(line => this.parseCsvRow(line))

      return {
        headers,
        rows,
        totalRows: lines.length - 1, // Subtract header row
      }
    } catch (error) {
      throw new BadRequestException('Invalid CSV file format')
    }
  }

  async processSpreadsheet(
    userId: string,
    spreadsheetId: string,
    processData: ProcessSpreadsheetDto,
  ): Promise<ProcessSpreadsheetResponseDto> {
    const spreadsheet = await this.getSpreadsheetById(userId, spreadsheetId)

    if (spreadsheet.status === 'processed') {
      throw new BadRequestException('Spreadsheet has already been processed')
    }

    const { columnMapping, templateId, dncColumn, dncValue } = processData

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'phone']
    const mappedFields = Object.values(columnMapping)
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field))

    if (missingFields.length > 0) {
      throw new BadRequestException(`Missing required fields: ${missingFields.join(', ')}`)
    }

    try {
      const csvContent = Buffer.from(spreadsheet.fileContent, 'base64').toString('utf-8')
      const lines = csvContent.split('\n').filter(line => line.trim() !== '')
      const headers = this.parseCsvRow(lines[0])
      const dataRows = lines.slice(1)

      const contacts = []
      const errors = []
      const duplicateContacts = []
      const userObjectId = new Types.ObjectId(userId)

      // Get all existing phone numbers for this user
      const existingContacts = await this.contactModel
        .find({ userId: userObjectId }, { phone: 1, firstName: 1, lastName: 1 })
        .exec()

      const existingPhones = new Set(existingContacts.map(contact => contact.phone))

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = this.parseCsvRow(dataRows[i])
          const contact = this.mapRowToContact(userId, spreadsheetId, headers, row, columnMapping, dncColumn, dncValue)

          // Check if this phone number already exists
          if (existingPhones.has(contact.phone)) {
            duplicateContacts.push({
              phone: contact.phone,
              firstName: contact.firstName,
              lastName: contact.lastName,
              reason: 'Phone number already exists in your contacts'
            })
            continue // Skip this contact
          }

          // Check for duplicates within the current spreadsheet being processed
          const isDuplicateInCurrentBatch = contacts.some(existing => existing.phone === contact.phone)
          if (isDuplicateInCurrentBatch) {
            duplicateContacts.push({
              phone: contact.phone,
              firstName: contact.firstName,
              lastName: contact.lastName,
              reason: 'Duplicate phone number found within the same spreadsheet'
            })
            continue // Skip this contact
          }

          contacts.push(contact)
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`)
        }
      }

      // Save only the non-duplicate contacts
      if (contacts.length > 0) {
        await this.contactModel.insertMany(contacts)
      }

      // Update spreadsheet with processing results
      spreadsheet.status = 'processed'
      spreadsheet.processedCount = contacts.length
      spreadsheet.skippedCount = duplicateContacts.length
      spreadsheet.processingErrors = errors
      spreadsheet.duplicateContacts = duplicateContacts
      if (templateId) {
        spreadsheet.templateId = new Types.ObjectId(templateId)
      }
      await spreadsheet.save()

      return {
        processed: contacts.length,
        skipped: duplicateContacts.length,
        errors,
        duplicateContacts,
      }
    } catch (error) {
      throw new BadRequestException(`Failed to process spreadsheet: ${error.message}`)
    }
  }

  async getTemplates(userId: string): Promise<ContactTemplateResponseDto[]> {
    const templates = await this.contactTemplateModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec()

    return templates.map(this.mapTemplateToResponseDto)
  }

  async createTemplate(
    userId: string,
    templateData: CreateTemplateDto,
  ): Promise<ContactTemplateResponseDto> {
    const template = new this.contactTemplateModel({
      userId: new Types.ObjectId(userId),
      name: templateData.name,
      columnMapping: new Map(Object.entries(templateData.columnMapping)),
      dncColumn: templateData.dncColumn,
      dncValue: templateData.dncValue,
    })

    const savedTemplate = await template.save()
    return this.mapTemplateToResponseDto(savedTemplate)
  }

  async getTemplateById(userId: string, templateId: string): Promise<ContactTemplateResponseDto> {
    const template = await this.contactTemplateModel
      .findOne({
        _id: new Types.ObjectId(templateId),
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (!template) {
      throw new NotFoundException('Template not found')
    }

    return this.mapTemplateToResponseDto(template)
  }

  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    const template = await this.contactTemplateModel
      .findOne({
        _id: new Types.ObjectId(templateId),
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (!template) {
      throw new NotFoundException('Template not found')
    }

    await template.deleteOne()
  }

  async createContact(
    userId: string,
    createData: CreateContactDto,
  ): Promise<ContactResponseDto> {
    const contact = new this.contactModel({
      userId: new Types.ObjectId(userId),
      firstName: createData.firstName,
      lastName: createData.lastName,
      phone: normalizePhoneNumber(createData.phone),
      email: createData.email,
      propertyAddress: createData.propertyAddress,
      propertyCity: createData.propertyCity,
      propertyState: createData.propertyState,
      propertyZip: createData.propertyZip,
      parcelCounty: createData.parcelCounty,
      parcelState: createData.parcelState,
      parcelAcres: createData.parcelAcres,
      apn: createData.apn,
      mailingAddress: createData.mailingAddress,
      mailingCity: createData.mailingCity,
      mailingState: createData.mailingState,
      mailingZip: createData.mailingZip,
      dnc: createData.dnc,
      dncUpdatedAt: createData.dnc !== undefined ? new Date() : undefined,
      // Note: spreadsheetId is not set for manually created contacts
    })

    try {
      const savedContact = await contact.save()
      return this.mapContactToResponseDto(savedContact)
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.phone) {
        throw new ConflictException('A contact with this phone number already exists')
      }
      throw error
    }
  }

  async getContacts(
    userId: string,
    query: GetContactsDto,
  ): Promise<{ data: ContactResponseDto[]; total: number }> {
    const {
      search,
      sortBy = 'firstName',
      sortOrder = 'asc',
      limit = 25,
      page = 1,
      spreadsheetId,
    } = query

    // Build filter
    const filter: any = { userId: new Types.ObjectId(userId) }

    if (spreadsheetId) {
      filter.spreadsheetId = new Types.ObjectId(spreadsheetId)
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    // Build sort
    const sort: any = {}
    const sortDirection = sortOrder === 'desc' ? -1 : 1

    switch (sortBy) {
      case 'newest':
        sort.createdAt = -1
        break
      case 'oldest':
        sort.createdAt = 1
        break
      case 'firstName':
        sort.firstName = sortDirection
        break
      case 'lastName':
        sort.lastName = sortDirection
        break
      case 'phone':
        sort.phone = sortDirection
        break
      case 'email':
        sort.email = sortDirection
        break
      case 'propertyAddress':
        sort.propertyAddress = sortDirection
        break
      case 'propertyCity':
        sort.propertyCity = sortDirection
        break
      case 'propertyState':
        sort.propertyState = sortDirection
        break
    }

    // Execute queries
    const [contacts, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .exec(),
      this.contactModel.countDocuments(filter).exec(),
    ])

    return {
      data: contacts.map(this.mapContactToResponseDto),
      total,
    }
  }

  async getContactById(userId: string, contactId: string): Promise<ContactResponseDto> {
    const contact = await this.contactModel
      .findOne({
        _id: new Types.ObjectId(contactId),
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (!contact) {
      throw new NotFoundException('Contact not found')
    }

    return this.mapContactToResponseDto(contact)
  }

  async updateContact(
    userId: string,
    contactId: string,
    updateData: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    const contact = await this.contactModel
      .findOne({
        _id: new Types.ObjectId(contactId),
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (!contact) {
      throw new NotFoundException('Contact not found')
    }

    // Track if DNC status is changing
    const isDncChanging = updateData.dnc !== undefined && updateData.dnc !== contact.dnc

    // Update only provided fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        if (key === 'phone') {
          contact[key] = normalizePhoneNumber(updateData[key])
        } else {
          contact[key] = updateData[key]
        }
      }
    })

    // Update DNC timestamp if DNC status changed
    if (isDncChanging) {
      contact.dncUpdatedAt = new Date()
    }

    try {
      const updatedContact = await contact.save()
      return this.mapContactToResponseDto(updatedContact)
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.phone) {
        throw new ConflictException('A contact with this phone number already exists')
      }
      throw error
    }
  }

  private parseCsvRow(row: string): string[] {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  private mapRowToContact(
    userId: string,
    spreadsheetId: string,
    headers: string[],
    row: string[],
    columnMapping: Record<string, string>,
    dncColumn?: string,
    dncValue?: string,
  ): any {
    const contact: any = {
      userId: new Types.ObjectId(userId),
      spreadsheetId: new Types.ObjectId(spreadsheetId),
    }

    // Map CSV columns to contact fields
    headers.forEach((header, index) => {
      const contactField = columnMapping[header]
      if (contactField && row[index]) {
        let value: any = row[index].trim()

        // Convert numeric fields
        if (contactField === 'parcelAcres' && value) {
          value = parseFloat(value) || 0
        }

        contact[contactField] = value
      }
    })

    // Handle DNC column processing
    if (dncColumn && dncValue) {
      const dncIndex = headers.indexOf(dncColumn)
      if (dncIndex !== -1) {
        // Always set DNC status based on column value, even if cell is empty
        const cellValue = (row[dncIndex] || '').trim().toLowerCase()
        const targetValue = dncValue.toLowerCase()
        contact.dnc = cellValue === targetValue
        // Always set the DNC updated date when processing CSV with DNC column
        contact.dncUpdatedAt = new Date()
      }
    }

    // Validate required fields
    if (!contact.firstName || !contact.lastName || !contact.phone) {
      throw new Error('Missing required fields: firstName, lastName, or phone')
    }

    // Check for invalid phone number values
    const invalidPhoneValues = ['landline excluded', 'excluded', 'n/a', 'na', 'none', 'null', 'undefined']
    if (invalidPhoneValues.includes(contact.phone.toLowerCase().trim())) {
      throw new Error(`Invalid phone number: ${contact.phone}`)
    }

    // Normalize phone number to ensure consistent format
    if (contact.phone) {
      const normalized = normalizePhoneNumber(contact.phone)
      // If normalization results in just a + sign or the original invalid value, reject it
      if (normalized === '+' || normalized === contact.phone && !/^\+?[\d\s\-\(\)]+$/.test(contact.phone)) {
        throw new Error(`Invalid phone number format: ${contact.phone}`)
      }
      contact.phone = normalized
    }

    return contact
  }

  private async calculateSpreadsheetStats(userId: string, spreadsheetId: string) {
    const filter = {
      userId: new Types.ObjectId(userId),
      spreadsheetId: new Types.ObjectId(spreadsheetId),
    }

    const [validContactsCount, nonDncCount, dncCount] = await Promise.all([
      // Total valid contacts from this spreadsheet
      this.contactModel.countDocuments(filter).exec(),
      // Contacts with DNC = false (excluding null/undefined)
      this.contactModel.countDocuments({ ...filter, dnc: false }).exec(),
      // Contacts with DNC = true (excluding null/undefined)
      this.contactModel.countDocuments({ ...filter, dnc: true }).exec(),
    ])

    return { validContactsCount, nonDncCount, dncCount }
  }

  private mapToResponseDto(
    spreadsheet: ContactSpreadsheetDocument,
    stats?: { validContactsCount: number; nonDncCount: number; dncCount: number }
  ): ContactSpreadsheetResponseDto {
    return {
      id: spreadsheet._id.toString(),
      originalFileName: spreadsheet.originalFileName,
      contactCount: spreadsheet.contactCount,
      uploadDate: spreadsheet.uploadDate.toISOString().split('T')[0],
      fileSize: spreadsheet.fileSize,
      status: spreadsheet.status,
      templateId: spreadsheet.templateId?.toString(),
      validContactsCount: stats?.validContactsCount,
      nonDncCount: stats?.nonDncCount,
      dncCount: stats?.dncCount,
      processedCount: spreadsheet.processedCount,
      skippedCount: spreadsheet.skippedCount,
      processingErrors: spreadsheet.processingErrors,
      duplicateContacts: spreadsheet.duplicateContacts,
    }
  }

  private mapTemplateToResponseDto(template: ContactTemplateDocument): ContactTemplateResponseDto {
    return {
      id: template._id.toString(),
      name: template.name,
      columnMapping: Object.fromEntries(template.columnMapping),
      dncColumn: template.dncColumn,
      dncValue: template.dncValue,
      createdAt: template.createdAt.toISOString(),
    }
  }

  async deleteContact(userId: string, contactId: string): Promise<void> {
    const contact = await this.contactModel
      .findOne({
        _id: new Types.ObjectId(contactId),
        userId: new Types.ObjectId(userId),
      })
      .exec()

    if (!contact) {
      throw new NotFoundException('Contact not found')
    }

    await this.contactModel.deleteOne({
      _id: new Types.ObjectId(contactId),
      userId: new Types.ObjectId(userId),
    })
  }

  async deleteMultipleContacts(userId: string, contactIds: string[]): Promise<void> {
    const objectIds = contactIds.map(id => new Types.ObjectId(id))

    const result = await this.contactModel.deleteMany({
      _id: { $in: objectIds },
      userId: new Types.ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      throw new NotFoundException('No contacts found to delete')
    }
  }

  private mapContactToResponseDto = (contact: ContactDocument): ContactResponseDto => {
    return {
      id: contact._id.toString(),
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      email: contact.email,
      propertyAddress: contact.propertyAddress,
      propertyCity: contact.propertyCity,
      propertyState: contact.propertyState,
      propertyZip: contact.propertyZip,
      parcelCounty: contact.parcelCounty,
      parcelState: contact.parcelState,
      parcelAcres: contact.parcelAcres,
      apn: contact.apn,
      mailingAddress: contact.mailingAddress,
      mailingCity: contact.mailingCity,
      mailingState: contact.mailingState,
      mailingZip: contact.mailingZip,
      dnc: contact.dnc,
      dncUpdatedAt: contact.dncUpdatedAt?.toISOString(),
    }
  }

  private async generateUniqueFileName(userId: string, originalFileName: string): Promise<string> {
    // Extract filename without extension and extension
    const lastDotIndex = originalFileName.lastIndexOf('.')
    const nameWithoutExt = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName
    const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : ''

    // Check if the original filename already exists
    const existingFiles = await this.contactSpreadsheetModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: { $ne: true }
      })
      .select('originalFileName')
      .exec()

    const existingFileNames = existingFiles.map(file => file.originalFileName)

    // If the original filename doesn't exist, return it as is
    if (!existingFileNames.includes(originalFileName)) {
      return originalFileName
    }

    // Find the highest number in existing files with the same base name
    let highestNumber = 0
    const regex = new RegExp(`^${nameWithoutExt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: \\((\\d+)\\))?${extension.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)

    existingFileNames.forEach(fileName => {
      const match = fileName.match(regex)
      if (match) {
        const number = match[1] ? parseInt(match[1], 10) : 0
        highestNumber = Math.max(highestNumber, number)
      }
    })

    // Generate the new filename with incremented number
    const newNumber = highestNumber + 1
    return `${nameWithoutExt} (${newNumber})${extension}`
  }
}
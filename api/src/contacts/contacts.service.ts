import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { ContactSpreadsheet, ContactSpreadsheetDocument } from './schemas/contact-spreadsheet.schema'
import { UploadSpreadsheetDto, GetSpreadsheetsDto, ContactSpreadsheetResponseDto } from './contacts.dto'

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(ContactSpreadsheet.name)
    private contactSpreadsheetModel: Model<ContactSpreadsheetDocument>,
  ) {}

  async uploadSpreadsheet(
    userId: string,
    uploadData: UploadSpreadsheetDto,
  ): Promise<ContactSpreadsheetResponseDto> {
    const contactSpreadsheet = new this.contactSpreadsheetModel({
      userId: new Types.ObjectId(userId),
      originalFileName: uploadData.originalFileName,
      contactCount: uploadData.contactCount,
      uploadDate: new Date(),
      fileContent: uploadData.fileContent,
      fileSize: uploadData.fileSize,
      isDeleted: false,
    })

    const savedSpreadsheet = await contactSpreadsheet.save()
    return this.mapToResponseDto(savedSpreadsheet)
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
    
    if (!includeDeleted) {
      filter.isDeleted = { $ne: true }
    } else if (includeDeleted === true) {
      filter.isDeleted = true
    }

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

    // Calculate total contacts
    const totalContactsResult = await this.contactSpreadsheetModel
      .aggregate([
        { $match: { userId: new Types.ObjectId(userId), isDeleted: { $ne: true } } },
        { $group: { _id: null, totalContacts: { $sum: '$contactCount' } } },
      ])
      .exec()

    const totalContacts = totalContactsResult[0]?.totalContacts || 0

    return {
      data: spreadsheets.map(this.mapToResponseDto),
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

    // Soft delete
    spreadsheet.isDeleted = true
    await spreadsheet.save()
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
        isDeleted: { $ne: true },
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

  private mapToResponseDto(spreadsheet: ContactSpreadsheetDocument): ContactSpreadsheetResponseDto {
    return {
      id: spreadsheet._id.toString(),
      originalFileName: spreadsheet.originalFileName,
      contactCount: spreadsheet.contactCount,
      uploadDate: spreadsheet.uploadDate.toISOString().split('T')[0],
      fileSize: spreadsheet.fileSize,
      isDeleted: spreadsheet.isDeleted,
    }
  }
}
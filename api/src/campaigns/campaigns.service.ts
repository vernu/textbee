import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import {
  MessageTemplateGroup,
  MessageTemplateGroupDocument,
} from './schemas/message-template-group.schema'
import {
  MessageTemplate,
  MessageTemplateDocument,
} from './schemas/message-template.schema'
import {
  CreateMessageTemplateGroupDto,
  UpdateMessageTemplateGroupDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  MessageTemplateGroupResponseDto,
  MessageTemplateResponseDto,
} from './campaigns.dto'

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(MessageTemplateGroup.name)
    private messageTemplateGroupModel: Model<MessageTemplateGroupDocument>,
    @InjectModel(MessageTemplate.name)
    private messageTemplateModel: Model<MessageTemplateDocument>,
  ) {}

  // Template Groups
  async createTemplateGroup(
    userId: string,
    createDto: CreateMessageTemplateGroupDto,
  ): Promise<MessageTemplateGroupResponseDto> {
    try {
      const templateGroup = new this.messageTemplateGroupModel({
        ...createDto,
        userId: new Types.ObjectId(userId),
      })

      const saved = await templateGroup.save()
      return this.formatTemplateGroupResponse(saved, [])
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'A template group with this name already exists',
        )
      }
      throw error
    }
  }

  async getTemplateGroups(
    userId: string,
  ): Promise<MessageTemplateGroupResponseDto[]> {
    const groups = await this.messageTemplateGroupModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()

    const result = []
    for (const group of groups) {
      const templates = await this.messageTemplateModel
        .find({ groupId: group._id })
        .sort({ createdAt: 1 })
        .lean()

      result.push(
        this.formatTemplateGroupResponse(
          group,
          templates.map((t) => this.formatTemplateResponse(t)),
        ),
      )
    }

    return result
  }

  async getTemplateGroup(
    userId: string,
    groupId: string,
  ): Promise<MessageTemplateGroupResponseDto> {
    const group = await this.messageTemplateGroupModel
      .findOne({
        _id: new Types.ObjectId(groupId),
        userId: new Types.ObjectId(userId),
      })
      .lean()

    if (!group) {
      throw new NotFoundException('Template group not found')
    }

    const templates = await this.messageTemplateModel
      .find({ groupId: group._id })
      .sort({ createdAt: 1 })
      .lean()

    return this.formatTemplateGroupResponse(
      group,
      templates.map((t) => this.formatTemplateResponse(t)),
    )
  }

  async updateTemplateGroup(
    userId: string,
    groupId: string,
    updateDto: UpdateMessageTemplateGroupDto,
  ): Promise<MessageTemplateGroupResponseDto> {
    try {
      const updated = await this.messageTemplateGroupModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(groupId),
            userId: new Types.ObjectId(userId),
          },
          { ...updateDto, updatedAt: new Date() },
          { new: true },
        )
        .lean()

      if (!updated) {
        throw new NotFoundException('Template group not found')
      }

      const templates = await this.messageTemplateModel
        .find({ groupId: updated._id })
        .sort({ createdAt: 1 })
        .lean()

      return this.formatTemplateGroupResponse(
        updated,
        templates.map((t) => this.formatTemplateResponse(t)),
      )
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'A template group with this name already exists',
        )
      }
      throw error
    }
  }

  async deleteTemplateGroup(userId: string, groupId: string): Promise<void> {
    const group = await this.messageTemplateGroupModel.findOne({
      _id: new Types.ObjectId(groupId),
      userId: new Types.ObjectId(userId),
    })

    if (!group) {
      throw new NotFoundException('Template group not found')
    }

    // Delete all templates in the group first
    await this.messageTemplateModel.deleteMany({ groupId: group._id })

    // Delete the group
    await this.messageTemplateGroupModel.deleteOne({ _id: group._id })
  }

  // Templates
  async createTemplate(
    userId: string,
    createDto: CreateMessageTemplateDto,
  ): Promise<MessageTemplateResponseDto> {
    // Verify the group exists and belongs to the user
    const group = await this.messageTemplateGroupModel.findOne({
      _id: new Types.ObjectId(createDto.groupId),
      userId: new Types.ObjectId(userId),
    })

    if (!group) {
      throw new NotFoundException('Template group not found')
    }

    try {
      const template = new this.messageTemplateModel({
        ...createDto,
        userId: new Types.ObjectId(userId),
        groupId: new Types.ObjectId(createDto.groupId),
      })

      const saved = await template.save()
      return this.formatTemplateResponse(saved)
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'A template with this name already exists in this group',
        )
      }
      throw error
    }
  }

  async getTemplates(
    userId: string,
    groupId?: string,
  ): Promise<MessageTemplateResponseDto[]> {
    const filter: any = { userId: new Types.ObjectId(userId) }
    if (groupId) {
      filter.groupId = new Types.ObjectId(groupId)
    }

    const templates = await this.messageTemplateModel
      .find(filter)
      .sort({ createdAt: 1 })
      .lean()

    return templates.map((t) => this.formatTemplateResponse(t))
  }

  async getTemplate(
    userId: string,
    templateId: string,
  ): Promise<MessageTemplateResponseDto> {
    const template = await this.messageTemplateModel
      .findOne({
        _id: new Types.ObjectId(templateId),
        userId: new Types.ObjectId(userId),
      })
      .lean()

    if (!template) {
      throw new NotFoundException('Template not found')
    }

    return this.formatTemplateResponse(template)
  }

  async updateTemplate(
    userId: string,
    templateId: string,
    updateDto: UpdateMessageTemplateDto,
  ): Promise<MessageTemplateResponseDto> {
    try {
      const updated = await this.messageTemplateModel
        .findOneAndUpdate(
          {
            _id: new Types.ObjectId(templateId),
            userId: new Types.ObjectId(userId),
          },
          { ...updateDto, updatedAt: new Date() },
          { new: true },
        )
        .lean()

      if (!updated) {
        throw new NotFoundException('Template not found')
      }

      return this.formatTemplateResponse(updated)
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'A template with this name already exists in this group',
        )
      }
      throw error
    }
  }

  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    const result = await this.messageTemplateModel.deleteOne({
      _id: new Types.ObjectId(templateId),
      userId: new Types.ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      throw new NotFoundException('Template not found')
    }
  }

  // Helper methods
  private formatTemplateGroupResponse(
    group: any,
    templates: MessageTemplateResponseDto[],
  ): MessageTemplateGroupResponseDto {
    return {
      _id: group._id.toString(),
      userId: group.userId.toString(),
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      templates,
    }
  }

  private formatTemplateResponse(template: any): MessageTemplateResponseDto {
    return {
      _id: template._id.toString(),
      userId: template.userId.toString(),
      groupId: template.groupId.toString(),
      name: template.name,
      content: template.content,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }
  }
}
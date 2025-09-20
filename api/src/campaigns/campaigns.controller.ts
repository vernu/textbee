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
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CampaignsService } from './campaigns.service'
import {
  CreateMessageTemplateGroupDto,
  UpdateMessageTemplateGroupDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  ReorderTemplateGroupsDto,
  MessageTemplateGroupResponseDto,
  MessageTemplateResponseDto,
} from './campaigns.dto'

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // Template Groups
  @Post('template-groups')
  @ApiOperation({ summary: 'Create a new message template group' })
  async createTemplateGroup(
    @Request() req,
    @Body() createDto: CreateMessageTemplateGroupDto,
  ): Promise<MessageTemplateGroupResponseDto> {
    return this.campaignsService.createTemplateGroup(req.user.id, createDto)
  }

  @Get('template-groups')
  @ApiOperation({ summary: 'Get all message template groups' })
  async getTemplateGroups(
    @Request() req,
  ): Promise<MessageTemplateGroupResponseDto[]> {
    return this.campaignsService.getTemplateGroups(req.user.id)
  }

  @Get('template-groups/:id')
  @ApiOperation({ summary: 'Get a specific message template group' })
  async getTemplateGroup(
    @Request() req,
    @Param('id') groupId: string,
  ): Promise<MessageTemplateGroupResponseDto> {
    return this.campaignsService.getTemplateGroup(req.user.id, groupId)
  }

  @Put('template-groups/reorder')
  @ApiOperation({ summary: 'Reorder message template groups' })
  async reorderTemplateGroups(
    @Request() req,
    @Body() reorderDto: ReorderTemplateGroupsDto,
  ): Promise<MessageTemplateGroupResponseDto[]> {
    return this.campaignsService.reorderTemplateGroups(req.user.id, reorderDto)
  }

  @Put('template-groups/:id')
  @ApiOperation({ summary: 'Update a message template group' })
  async updateTemplateGroup(
    @Request() req,
    @Param('id') groupId: string,
    @Body() updateDto: UpdateMessageTemplateGroupDto,
  ): Promise<MessageTemplateGroupResponseDto> {
    return this.campaignsService.updateTemplateGroup(
      req.user.id,
      groupId,
      updateDto,
    )
  }

  @Delete('template-groups/:id')
  @ApiOperation({ summary: 'Delete a message template group' })
  async deleteTemplateGroup(
    @Request() req,
    @Param('id') groupId: string,
  ): Promise<{ message: string }> {
    await this.campaignsService.deleteTemplateGroup(req.user.id, groupId)
    return { message: 'Template group deleted successfully' }
  }

  // Templates
  @Post('templates')
  @ApiOperation({ summary: 'Create a new message template' })
  async createTemplate(
    @Request() req,
    @Body() createDto: CreateMessageTemplateDto,
  ): Promise<MessageTemplateResponseDto> {
    return this.campaignsService.createTemplate(req.user.id, createDto)
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get message templates' })
  async getTemplates(
    @Request() req,
    @Query('groupId') groupId?: string,
  ): Promise<MessageTemplateResponseDto[]> {
    return this.campaignsService.getTemplates(req.user.id, groupId)
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a specific message template' })
  async getTemplate(
    @Request() req,
    @Param('id') templateId: string,
  ): Promise<MessageTemplateResponseDto> {
    return this.campaignsService.getTemplate(req.user.id, templateId)
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a message template' })
  async updateTemplate(
    @Request() req,
    @Param('id') templateId: string,
    @Body() updateDto: UpdateMessageTemplateDto,
  ): Promise<MessageTemplateResponseDto> {
    return this.campaignsService.updateTemplate(
      req.user.id,
      templateId,
      updateDto,
    )
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a message template' })
  async deleteTemplate(
    @Request() req,
    @Param('id') templateId: string,
  ): Promise<{ message: string }> {
    await this.campaignsService.deleteTemplate(req.user.id, templateId)
    return { message: 'Template deleted successfully' }
  }
}
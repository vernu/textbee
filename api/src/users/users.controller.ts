import { Controller, Get, Post, Body, UseGuards, Request, Patch } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('conversations/mark-read')
  async markConversationAsRead(
    @Request() req,
    @Body() body: { normalizedPhoneNumber: string; lastSeenAt?: string }
  ) {
    const lastSeenAt = body.lastSeenAt ? new Date(body.lastSeenAt) : new Date()

    return await this.usersService.markConversationAsRead(
      req.user._id,
      body.normalizedPhoneNumber,
      lastSeenAt
    )
  }

  @Get('conversations/read-statuses')
  async getConversationReadStatuses(@Request() req) {
    return await this.usersService.getConversationReadStatuses(req.user._id)
  }

  @Get('conversations/metadata')
  async getConversationMetadata(@Request() req) {
    return await this.usersService.getConversationMetadata(req.user._id)
  }

  @Post('conversations/archive')
  async archiveConversations(
    @Request() req,
    @Body() body: { phoneNumbers: string[] }
  ) {
    return await this.usersService.archiveConversations(req.user._id, body.phoneNumbers)
  }

  @Post('conversations/unarchive')
  async unarchiveConversations(
    @Request() req,
    @Body() body: { phoneNumbers: string[] }
  ) {
    return await this.usersService.unarchiveConversations(req.user._id, body.phoneNumbers)
  }

  @Post('conversations/block')
  async blockContacts(
    @Request() req,
    @Body() body: { phoneNumbers: string[] }
  ) {
    return await this.usersService.blockContacts(req.user._id, body.phoneNumbers)
  }

  @Post('conversations/unblock')
  async unblockContacts(
    @Request() req,
    @Body() body: { phoneNumbers: string[] }
  ) {
    return await this.usersService.unblockContacts(req.user._id, body.phoneNumbers)
  }

  @Patch('conversations/star')
  async toggleConversationStar(
    @Request() req,
    @Body() body: { phoneNumber: string; isStarred: boolean }
  ) {
    return await this.usersService.toggleConversationStar(req.user._id, body.phoneNumber, body.isStarred)
  }
}

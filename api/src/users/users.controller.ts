import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common'
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
}

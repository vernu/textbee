import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import {
  CreateSupportMessageDto,
  SupportCategory,
} from './dto/create-support-message.dto'
import { SupportService } from './support.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request } from 'express'
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard'

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @UseGuards(OptionalAuthGuard)
  @Post('customer-support')
  async createSupportMessage(
    @Body() createSupportMessageDto: CreateSupportMessageDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string)
    const userAgent = req.headers['user-agent'] as string

    // Add request metadata
    createSupportMessageDto.ip = ip
    createSupportMessageDto.userAgent = userAgent

    // If user is authenticated, associate the support request with the user
    if (req.user) {
      createSupportMessageDto.user = req.user['_id']
    }

    return this.supportService.createSupportMessage(createSupportMessageDto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-account-deletion')
  async requestAccountDeletion(
    @Body() body: { message: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string)
    const userAgent = req.headers['user-agent'] as string
    const user = req.user

    const createSupportMessageDto: CreateSupportMessageDto = {
      user: user['_id'],
      name: user['name'],
      email: user['email'],
      category: SupportCategory.ACCOUNT_DELETION,
      message: body.message,
      ip,
      userAgent,
    }

    return this.supportService.requestAccountDeletion(createSupportMessageDto)
  }
}

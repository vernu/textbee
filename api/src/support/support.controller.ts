import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger'
import {
  CreateSupportMessageDto,
  SupportCategory,
} from './dto/create-support-message.dto'
import {
  RequestAccountDeletionDto,
  SupportMessageResponseDTO,
} from './dto/request-account-deletion.dto'
import { SupportService } from './support.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { TurnstileService } from '../common/turnstile.service'
import { resolveClientAddress } from '../common/client-address'

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly turnstileService: TurnstileService,
  ) {}

  @ApiOperation({
    summary: 'Contact support',
    description:
      'Sends a message to the textbee support team and emails you a confirmation. The account behind the credentials is attached automatically.',
  })
  @ApiResponse({
    status: 201,
    description: 'The request was recorded.',
    type: SupportMessageResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'The Turnstile check failed.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or revoked API key.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many support requests from this account recently.',
  })
  @ApiBearerAuth()
  @ApiSecurity('x-api-key')
  @UseGuards(AuthGuard)
  @Post('customer-support')
  async createSupportMessage(
    @Body() createSupportMessageDto: CreateSupportMessageDto,
    @Req() req: Request,
  ) {
    await this.turnstileService.verify(createSupportMessageDto.turnstileToken)

    const ip = resolveClientAddress(req).ip
    const userAgent = req.headers['user-agent'] as string

    // Add request metadata
    createSupportMessageDto.ip = ip
    createSupportMessageDto.userAgent = userAgent

    // Always taken from the token so the body cannot set it
    createSupportMessageDto.user = req.user['_id']

    return this.supportService.createSupportMessage(createSupportMessageDto)
  }

  @ApiOperation({
    summary: 'Request account deletion',
    description:
      'Files a deletion request for the signed in account. Requires a dashboard session, not an API key.',
  })
  @ApiResponse({
    status: 201,
    description: 'The deletion request was recorded.',
    type: SupportMessageResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'The Turnstile check failed.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid session.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('request-account-deletion')
  async requestAccountDeletion(
    @Body() body: RequestAccountDeletionDto,
    @Req() req: Request,
  ) {
    await this.turnstileService.verify(body.turnstileToken)

    const ip = resolveClientAddress(req).ip
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
      turnstileToken: body.turnstileToken,
    }

    return this.supportService.requestAccountDeletion(createSupportMessageDto)
  }
}

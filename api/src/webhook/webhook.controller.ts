import {
  Body,
  Request,
  Param,
  Post,
  Patch,
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CreateWebhookDto, UpdateWebhookDto } from './webhook.dto'
import { AuthGuard } from 'src/auth/guards/auth.guard'

@ApiTags('webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getWebhooks(@Request() req) {
    const data = await this.webhookService.findWebhooksForUser({
      user: req.user,
    })
    return { data }
  }

  @Get(':webhookId')
  @UseGuards(AuthGuard)
  async getWebhook(@Request() req, @Param('webhookId') webhookId: string) {
    const data = await this.webhookService.findOne({
      user: req.user,
      webhookId,
    })
    return { data }
  }

  @Post()
  @UseGuards(AuthGuard)
  async createWebhook(
    @Request() req,
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    const data = await this.webhookService.create({
      user: req.user,
      createWebhookDto,
    })
    return { data }
  }

  @Patch(':webhookId')
  @UseGuards(AuthGuard)
  async updateWebhook(
    @Request() req,
    @Param('webhookId') webhookId: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    const data = await this.webhookService.update({
      user: req.user,
      webhookId,
      updateWebhookDto,
    })
    return { data }
  }
}

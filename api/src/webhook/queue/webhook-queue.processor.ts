import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { WebhookService } from '../webhook.service'
import { Logger } from '@nestjs/common'

@Processor('webhook-delivery')
export class WebhookQueueProcessor {
  private readonly logger = new Logger(WebhookQueueProcessor.name)

  constructor(private readonly webhookService: WebhookService) {}

  @Process({
    name: 'deliver-webhook',
    concurrency: 10,
  })
  async handleWebhookDelivery(job: Job<{ notificationId: string }>) {
    this.logger.debug(`Processing webhook delivery job ${job.id} for notification ${job.data.notificationId}`)

    try {
      await this.webhookService.attemptWebhookDelivery(job.data.notificationId)
    } catch (error) {
      this.logger.error(
        `Failed to process webhook delivery job ${job.id} for notification ${job.data.notificationId}`,
        error,
      )
      throw error
    }
  }
}

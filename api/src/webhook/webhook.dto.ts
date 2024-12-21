import { WebhookEvent } from './webhook-event.enum'

export class CreateWebhookDto {
  deliveryUrl: string
  signingSecret?: string
  events: WebhookEvent[]
}

export class UpdateWebhookDto {
  isActive: boolean
  deliveryUrl: string
  signingSecret: string
  events: WebhookEvent[]
}

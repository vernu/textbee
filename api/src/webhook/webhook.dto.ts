import { WebhookEvent } from './webhook-event.enum'

export class CreateWebhookDto {
  name?: string
  deliveryUrl: string
  signingSecret?: string
  events: WebhookEvent[]
}

export class UpdateWebhookDto {
  name?: string
  isActive: boolean
  deliveryUrl: string
  signingSecret: string
  events: WebhookEvent[]
}

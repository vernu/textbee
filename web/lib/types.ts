export interface WebhookData {
  _id?: string
  deliveryUrl: string
  events: string[]
  isActive: boolean
  signingSecret: string
}

export interface WebhookPayload {
  smsId: string
  sender: string
  message: string
  receivedAt: string
  deviceId: string
  webhookSubscriptionId: string
  webhookEvent: string
}

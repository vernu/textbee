import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CampaignsController } from './campaigns.controller'
import { CampaignsService } from './campaigns.service'
import {
  MessageTemplateGroup,
  MessageTemplateGroupSchema,
} from './schemas/message-template-group.schema'
import {
  MessageTemplate,
  MessageTemplateSchema,
} from './schemas/message-template.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageTemplateGroup.name, schema: MessageTemplateGroupSchema },
      { name: MessageTemplate.name, schema: MessageTemplateSchema },
    ]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
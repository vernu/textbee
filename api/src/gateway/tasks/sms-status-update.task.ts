import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SMS } from '../schemas/sms.schema';
import { SMSBatch } from '../schemas/sms-batch.schema';


@Injectable()
export class SmsStatusUpdateTask {
  private readonly logger = new Logger(SmsStatusUpdateTask.name);

  constructor(
    @InjectModel(SMS.name) private smsModel: Model<SMS>,
    @InjectModel(SMSBatch.name) private smsBatchModel: Model<SMSBatch>,
  ) {}

  /**
   * Cron job that runs every 5 minutes to update the status of SMS messages
   * that have been pending for more than 20 minutes without any status updates.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePendingSmsTimeout() {
    this.logger.log('Running cron job to update stale pending SMS messages');
    
    const twentyMinutesAgo = new Date();
    twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);

    try {

      const result = await this.smsModel.updateMany(
        {
          status: 'pending',
          requestedAt: { $lt: twentyMinutesAgo },
        },
        {
          $set: { 
            status: 'unknown',
            errorMessage: 'Status update timeout - no response received after 20 minutes'
          }
        }
      );



      this.logger.log(`Updated ${result.modifiedCount} SMS messages from 'pending' to 'unknown' status`);
      
      const batchResult = await this.smsBatchModel.updateMany(
        {
          status: 'pending',
          createdAt: { $lt: twentyMinutesAgo }
        },
        {
          $set: { 
            status: 'unknown',
            error: 'Status update timeout - no response received after 20 minutes'
          }
        }
      );


      
      this.logger.log(`Updated ${batchResult.modifiedCount} SMS batches from 'pending' to 'unknown' status`);
    } catch (error) {
      this.logger.error('Error updating stale pending SMS messages', error);
    }
  }
} 
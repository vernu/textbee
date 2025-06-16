import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SmsStatusUpdateTask } from './sms-status-update.task';
import { SMS } from '../schemas/sms.schema';
import { SMSBatch } from '../schemas/sms-batch.schema';
import { Model } from 'mongoose';

describe('SmsStatusUpdateTask', () => {
  let task: SmsStatusUpdateTask;
  let smsModel: Model<SMS>;
  let smsBatchModel: Model<SMSBatch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsStatusUpdateTask,
        {
          provide: getModelToken(SMS.name),
          useValue: {
            updateMany: jest.fn().mockResolvedValue({ modifiedCount: 5 }),
          },
        },
        {
          provide: getModelToken(SMSBatch.name),
          useValue: {
            updateMany: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
          },
        },
      ],
    }).compile();

    task = module.get<SmsStatusUpdateTask>(SmsStatusUpdateTask);
    smsModel = module.get<Model<SMS>>(getModelToken(SMS.name));
    smsBatchModel = module.get<Model<SMSBatch>>(getModelToken(SMSBatch.name));
  });

  it('should be defined', () => {
    expect(task).toBeDefined();
  });

  describe('handlePendingSmsTimeout', () => {
    it('should update stale pending SMS messages to unknown status', async () => {
      jest.spyOn(smsModel, 'updateMany');
      jest.spyOn(smsBatchModel, 'updateMany');

      await task.handlePendingSmsTimeout();

      // Check that SMS model was updated with correct query
      expect(smsModel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          requestedAt: expect.any(Object),
        }),
        {
          $set: {
            status: 'unknown',
            errorMessage: 'Status update timeout - no response received after 20 minutes',
          },
        },
      );

      // Check that SMSBatch model was updated with correct query
      expect(smsBatchModel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          createdAt: expect.any(Object),
        }),
        {
          $set: {
            status: 'unknown',
            error: 'Status update timeout - no response received after 20 minutes',
          },
        },
      );
    });
  });
}); 
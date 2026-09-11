import { SmsQueueProcessor, resolveBatchStatus } from './sms-queue.processor'
import * as firebaseAdmin from 'firebase-admin'

jest.mock('firebase-admin', () => ({
  messaging: jest.fn().mockReturnValue({
    sendEach: jest.fn(),
  }),
}))

describe('resolveBatchStatus', () => {
  it('keeps a paced batch in processing while waves are still queued', () => {
    expect(
      resolveBatchStatus({ recipientCount: 2000, successCount: 50, failureCount: 0 }),
    ).toBe('processing')
  })

  it('stays in processing while draining even if some pushes failed', () => {
    expect(
      resolveBatchStatus({ recipientCount: 2000, successCount: 45, failureCount: 5 }),
    ).toBe('processing')
  })

  it('completes once every recipient was pushed without failures', () => {
    expect(
      resolveBatchStatus({ recipientCount: 100, successCount: 100, failureCount: 0 }),
    ).toBe('completed')
  })

  it('fails when every push failed', () => {
    expect(
      resolveBatchStatus({ recipientCount: 100, successCount: 0, failureCount: 100 }),
    ).toBe('failed')
  })

  it('is partial_success when finished with mixed results', () => {
    expect(
      resolveBatchStatus({ recipientCount: 100, successCount: 90, failureCount: 10 }),
    ).toBe('partial_success')
  })
})

describe('SmsQueueProcessor.handleSendSms', () => {
  const deviceId = 'device123'
  const userId = 'user123'
  const smsBatchId = 'batch123'
  const originalEnv = { ...process.env }

  const fcmMessages = [
    {
      token: 'fcm-token',
      data: { smsData: JSON.stringify({ smsId: 'sms-1' }) },
    },
  ]

  const mockDeviceModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  }
  const mockSmsModel = {
    updateMany: jest.fn(),
    find: jest.fn(),
  }
  const mockSmsBatchModel = {
    findByIdAndUpdate: jest.fn(),
  }
  const mockWebhookService = { deliverNotification: jest.fn() }
  const mockUsersService = { markMilestone: jest.fn() }

  let processor: SmsQueueProcessor

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }

    mockDeviceModel.findById.mockReturnValue({
      populate: () => ({
        exec: jest.fn().mockResolvedValue({ _id: deviceId, user: { _id: userId } }),
      }),
    })
    mockDeviceModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(true),
    })
    mockSmsBatchModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(true),
      recipientCount: 1,
      successCount: 1,
      failureCount: 0,
    })
    mockSmsModel.updateMany.mockResolvedValue({ modifiedCount: 1 })
    mockSmsModel.find.mockResolvedValue([])
    mockUsersService.markMilestone.mockResolvedValue(false)

    processor = new SmsQueueProcessor(
      mockDeviceModel as any,
      mockSmsModel as any,
      mockSmsBatchModel as any,
      mockWebhookService as any,
      mockUsersService as any,
    )
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  const job = { id: 1, data: { deviceId, fcmMessages, smsBatchId } } as any

  it('pushes normally when nothing is listed for skipping', async () => {
    const sendEach = jest
      .spyOn(firebaseAdmin.messaging(), 'sendEach')
      .mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true, messageId: 'fcm-1' }],
      } as any)

    await processor.handleSendSms(job)

    expect(sendEach).toHaveBeenCalledWith(fcmMessages)
    expect(mockSmsModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['sms-1'] } },
      { $set: { status: 'dispatched', dispatchedAt: expect.any(Date) } },
    )
  })

  it('withholds the push for a listed user and marks the message', async () => {
    process.env.FCM_SEND_SKIP_USER_IDS = userId
    const sendEach = jest.spyOn(firebaseAdmin.messaging(), 'sendEach')

    const response = await processor.handleSendSms(job)

    expect(sendEach).not.toHaveBeenCalled()
    expect(response.successCount).toBe(1)
    expect(mockSmsModel.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['sms-1'] } },
      {
        $set: {
          status: 'dispatched',
          dispatchedAt: expect.any(Date),
          errorCode: 'FCM_SEND_SKIPPED',
        },
      },
    )
    expect(mockSmsBatchModel.findByIdAndUpdate).toHaveBeenCalledWith(
      smsBatchId,
      { $set: { status: 'completed' } },
    )
  })

  it('withholds the push for a listed device', async () => {
    process.env.FCM_SEND_SKIP_DEVICE_IDS = 'other-device,' + deviceId
    const sendEach = jest.spyOn(firebaseAdmin.messaging(), 'sendEach')

    await processor.handleSendSms(job)

    expect(sendEach).not.toHaveBeenCalled()
  })
})

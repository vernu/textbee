import { ConflictException, HttpException, NotFoundException } from '@nestjs/common'
import { SupportService } from './support.service'
import { SupportCategory } from './dto/create-support-message.dto'

const VALID_USER_ID = '507f1f77bcf86cd799439011'

const build = () => {
  let lastMessageDoc: any

  const supportMessageModel: any = jest.fn().mockImplementation((doc: any) => {
    lastMessageDoc = {
      ...doc,
      _id: 'msg_1',
      save: jest.fn().mockResolvedValue({ ...doc, _id: 'msg_1' }),
    }
    return lastMessageDoc
  })
  supportMessageModel.countDocuments = jest.fn()
  supportMessageModel.findOne = jest.fn()

  const userModel = {
    findById: jest.fn(),
    updateOne: jest.fn().mockResolvedValue(undefined),
  }
  const mailService = { sendEmailFromTemplate: jest.fn().mockResolvedValue(undefined) }

  const service = new SupportService(
    supportMessageModel,
    userModel as any,
    mailService as any,
  )

  return {
    service,
    supportMessageModel,
    userModel,
    mailService,
    getLastMessageDoc: () => lastMessageDoc,
  }
}

const dto = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ada',
  email: 'a@b.com',
  category: SupportCategory.GENERAL,
  message: 'help please',
  turnstileToken: 'token',
  ...overrides,
})

describe('SupportService', () => {
  describe('createSupportMessage', () => {
    it('rejects once the 24h rate limit is reached, without persisting or emailing', async () => {
      const { service, supportMessageModel, mailService } = build()
      supportMessageModel.countDocuments.mockResolvedValue(3)

      await expect(service.createSupportMessage(dto() as any)).rejects.toThrow(
        HttpException,
      )
      expect(mailService.sendEmailFromTemplate).not.toHaveBeenCalled()
    })

    it('persists the message and sends a confirmation on success', async () => {
      const { service, supportMessageModel, mailService, getLastMessageDoc } = build()
      supportMessageModel.countDocuments.mockResolvedValue(0)

      const res = await service.createSupportMessage(dto() as any)

      expect(getLastMessageDoc().save).toHaveBeenCalledTimes(1)
      // The turnstile token is stripped before persistence.
      expect(getLastMessageDoc()).not.toHaveProperty('turnstileToken')
      expect(mailService.sendEmailFromTemplate).toHaveBeenCalledTimes(1)
      expect(mailService.sendEmailFromTemplate.mock.calls[0][0].to).toBe('a@b.com')
      expect(res.message).toMatch(/submitted/i)
    })
  })

  describe('requestAccountDeletion', () => {
    it('rejects when the user id is missing or invalid', async () => {
      const { service } = build()
      await expect(
        service.requestAccountDeletion(dto({ user: 'not-an-id' }) as any),
      ).rejects.toThrow(NotFoundException)
    })

    it('rejects when the user does not exist', async () => {
      const { service, userModel } = build()
      userModel.findById.mockResolvedValue(null)

      await expect(
        service.requestAccountDeletion(dto({ user: VALID_USER_ID }) as any),
      ).rejects.toThrow(NotFoundException)
    })

    it('rejects a duplicate deletion request', async () => {
      const { service, userModel, supportMessageModel } = build()
      userModel.findById.mockResolvedValue({ _id: VALID_USER_ID, email: 'a@b.com', name: 'Ada' })
      supportMessageModel.findOne.mockResolvedValue({ _id: 'existing' })

      await expect(
        service.requestAccountDeletion(dto({ user: VALID_USER_ID }) as any),
      ).rejects.toThrow(ConflictException)
    })

    it('records the deletion request with reason and emails the user on success', async () => {
      const { service, userModel, supportMessageModel, mailService } = build()
      userModel.findById.mockResolvedValue({ _id: VALID_USER_ID, email: 'a@b.com', name: 'Ada' })
      supportMessageModel.findOne.mockResolvedValue(null)

      const res = await service.requestAccountDeletion(
        dto({ user: VALID_USER_ID, message: 'no longer needed' }) as any,
      )

      expect(userModel.updateOne).toHaveBeenCalledTimes(1)
      const [, update] = userModel.updateOne.mock.calls[0]
      expect(update.accountDeletionRequestedAt).toBeInstanceOf(Date)
      expect(update.accountDeletionReason).toBe('no longer needed')
      expect(mailService.sendEmailFromTemplate).toHaveBeenCalledTimes(1)
      expect(res.message).toMatch(/submitted/i)
    })
  })
})

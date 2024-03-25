import { MailerService } from '@nest-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail({ to, subject, html }) {
    try {
      await this.mailerService.sendMail({ to, subject, html })
    } catch (e) {
      console.log(e)
    }
  }

  async sendEmailFromTemplate({ to, subject, template, context }) {
    try {
      await this.mailerService.sendMail({ to, subject, template, context })
    } catch (e) {
      console.log(e)
    }
  }
}

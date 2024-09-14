import { MailerService } from '@nest-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail({ to, subject, html }) {
    const sendMailOptions = {
      to,
      subject,
      html,
    }

    if (process.env.MAIL_REPLY_TO) {
      sendMailOptions['replyTo'] = process.env.MAIL_REPLY_TO
    }
    try {
      await this.mailerService.sendMail(sendMailOptions)
    } catch (e) {
      console.log(e)
    }
  }

  async sendEmailFromTemplate({ to, subject, template, context }) {
    const sendMailOptions = {
      to,
      subject,
      template,
      context,
    }

    if (process.env.MAIL_REPLY_TO) {
      sendMailOptions['replyTo'] = process.env.MAIL_REPLY_TO
    }

    try {
      await this.mailerService.sendMail(sendMailOptions)
    } catch (e) {
      console.log(e)
    }
  }
}

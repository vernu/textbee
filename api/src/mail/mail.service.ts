import { ISendMailOptions, MailerService } from '@nest-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail({ to, subject, html, from }) {
    const sendMailOptions: ISendMailOptions = {
      to,
      subject,
      html,
    }

    if (from) {
      sendMailOptions['from'] = from
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

  async sendEmailFromTemplate({ to, subject, template, context, from }: ISendMailOptions) {
    const sendMailOptions: ISendMailOptions = {
      to,
      subject,
      template,
      context,
    }

    if (from) {
      sendMailOptions['from'] = from
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

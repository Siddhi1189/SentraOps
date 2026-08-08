import nodemailer from 'nodemailer';
import NotificationProvider from './NotificationProvider.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

class EmailNotificationProvider extends NotificationProvider {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async send({ recipient, subject, body }) {
    const mailOptions = {
      from: env.SMTP_FROM,
      to: recipient,
      subject,
      html: body,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Failed to send email to ${recipient}: ${err.message}`);
      throw err;
    }
  }
}

export default EmailNotificationProvider;

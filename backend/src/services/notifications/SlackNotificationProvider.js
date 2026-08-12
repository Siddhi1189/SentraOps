import NotificationProvider from './NotificationProvider.js';
import logger from '../../utils/logger.js';

class SlackNotificationProvider extends NotificationProvider {
  /**
   * Dispatch Slack notification via Slack Incoming Webhook
   * @param {Object} payload
   * @param {string} payload.recipient - Slack Webhook URL
   * @param {string} payload.subject   - Header title
   * @param {string} payload.body      - Notification message text
   * @param {Object} [payload.metadata]- Optional extra formatting or blocks
   */
  async send({ recipient, subject, body, metadata = {} }) {
    try {
      const response = await fetch(recipient, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `*${subject}*\n${body}`,
          attachments: metadata.attachments || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack notification returned status ${response.status}: ${response.statusText}`);
      }

      logger.info(`Slack notification sent successfully to ${recipient}`);
      return { success: true, status: response.status };
    } catch (err) {
      logger.error(`Failed to send Slack notification to ${recipient}: ${err.message}`);
      throw err;
    }
  }
}

export default SlackNotificationProvider;

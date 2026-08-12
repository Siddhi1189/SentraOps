import NotificationProvider from './NotificationProvider.js';
import logger from '../../utils/logger.js';

class WebhookNotificationProvider extends NotificationProvider {
  /**
   * Send HTTP POST payload to webhook endpoint
   * @param {Object} payload
   * @param {string} payload.recipient - Target Webhook URL
   * @param {string} payload.subject   - Event title/subject
   * @param {string} payload.body      - Event detail body
   * @param {Object} [payload.metadata]- Additional payload data
   */
  async send({ recipient, subject, body, metadata = {} }) {
    try {
      const response = await fetch(recipient, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SentraOps-Notifier/1.0',
        },
        body: JSON.stringify({
          event: subject,
          message: body,
          timestamp: new Date().toISOString(),
          ...metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}: ${response.statusText}`);
      }

      logger.info(`Webhook dispatched successfully to ${recipient}`);
      return { success: true, status: response.status };
    } catch (err) {
      logger.error(`Failed to dispatch webhook to ${recipient}: ${err.message}`);
      throw err;
    }
  }
}

export default WebhookNotificationProvider;

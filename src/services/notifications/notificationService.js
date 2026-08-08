import EmailNotificationProvider from './EmailNotificationProvider.js';
import SlackNotificationProvider from './SlackNotificationProvider.js';
import WebhookNotificationProvider from './WebhookNotificationProvider.js';
import { NotificationChannels } from '../../constants.js';
import logger from '../../utils/logger.js';

// Channel-to-provider registry — add new channels here without touching worker logic
const providers = {
  [NotificationChannels.EMAIL]: new EmailNotificationProvider(),
  [NotificationChannels.SLACK]: new SlackNotificationProvider(),
  [NotificationChannels.WEBHOOK]: new WebhookNotificationProvider(),
};

class NotificationService {
  /**
   * Dispatch a notification to the correct provider by channel type
   * @param {string} channel - NotificationChannel enum value
   * @param {Object} payload
   */
  static async dispatch(channel, payload) {
    const provider = providers[channel];
    if (!provider) {
      logger.warn(`No notification provider registered for channel: ${channel}`);
      throw new Error(`Unsupported notification channel: ${channel}`);
    }
    return provider.send(payload);
  }
}

export default NotificationService;

/**
 * Abstract NotificationProvider interface.
 * All channel implementations must extend this class and implement send().
 */
class NotificationProvider {
  /**
   * @param {Object} payload
   * @param {string} payload.recipient   - email address, slack channel, webhook url, etc.
   * @param {string} payload.subject     - Notification subject/title
   * @param {string} payload.body        - Notification body/message
   * @param {Object} [payload.metadata]  - Extra channel-specific data
   */
  // eslint-disable-next-line no-unused-vars
  async send(payload) {
    throw new Error('NotificationProvider.send() must be implemented by subclass');
  }
}

export default NotificationProvider;

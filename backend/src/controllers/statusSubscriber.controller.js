import StatusSubscriberService from '../services/statusSubscriberService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const statusSubscriberController = {
  /**
   * POST /status/:orgSlug/subscribe
   * Begin double opt-in flow.
   */
  async subscribe(req, res, next) {
    try {
      const { orgSlug } = req.params;
      const { email } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new AppError('Valid email address is required', 400, 'VALIDATION_ERROR');
      }


      const result = await StatusSubscriberService.subscribe(orgSlug, email.toLowerCase().trim());
      return res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /status/confirm/:token
   * Confirm subscription via email link.
   */
  async confirm(req, res, next) {
    try {
      const { token } = req.params;
      const result = await StatusSubscriberService.confirm(token);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /status/unsubscribe/:token
   * Unsubscribe via link in email footer.
   */
  async unsubscribe(req, res, next) {
    try {
      const { token } = req.params;
      const result = await StatusSubscriberService.unsubscribe(token);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};

export default statusSubscriberController;

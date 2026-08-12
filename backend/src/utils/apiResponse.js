/**
 * Consistent API Response Helper
 */
class ApiResponse {
  /**
   * Send a successful response
   * @param {Object} res Express response object
   * @param {Object|Array} data Payload data
   * @param {number} status HTTP status code (default 200)
   * @param {Object} [meta] Metadata e.g. pagination stats
   */
  static success(res, data = {}, status = 200, meta = null) {
    const response = {
      success: true,
      data,
    };
    if (meta) {
      response.meta = meta;
    }
    return res.status(status).json(response);
  }

  /**
   * Send an error response
   * @param {Object} res Express response object
   * @param {string} code Error code string (e.g. 'VALIDATION_ERROR')
   * @param {string} message Human readable description of the error
   * @param {number} status HTTP status code (default 500)
   * @param {Object|Array} [details] Optional validation or debug detail context
   */
  static error(res, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred', status = 500, details = null) {
    const response = {
      success: false,
      error: {
        code,
        message,
      },
    };
    if (details) {
      response.error.details = details;
    }
    return res.status(status).json(response);
  }
}

export default ApiResponse;

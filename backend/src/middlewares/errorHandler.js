import logger from '../utils/logger.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * Express global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.code = err.code || 'INTERNAL_SERVER_ERROR';

  // Log the stack trace for non-operational errors, and the message for operational ones
  if (err.isOperational) {
    logger.warn(`Operational Error: [${err.code}] ${err.message}`);
  } else {
    logger.error(`Unhandled Error: ${err.message}\nStack: ${err.stack}`);
  }

  // Handle specific database/ORM errors from Prisma
  if (err.code && err.code.startsWith('P')) {
    // Prisma common errors
    if (err.code === 'P2002') {
      return ApiResponse.error(
        res,
        'DUPLICATE_ENTRY',
        `A record with this field already exists. Key fields: ${err.meta?.target || 'unknown'}`,
        409
      );
    }
    if (err.code === 'P2025') {
      return ApiResponse.error(res, 'RECORD_NOT_FOUND', 'Requested record not found or accessible', 404);
    }
  }

  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || err.errors) {
    const formattedErrors = err.errors || err.format?.();
    return ApiResponse.error(
      res,
      'VALIDATION_ERROR',
      'Request body validation failed',
      400,
      formattedErrors
    );
  }

  // Standard JSON response
  return ApiResponse.error(
    res,
    err.code,
    err.message || 'An unexpected server error occurred',
    err.statusCode
  );
};

export default errorHandler;

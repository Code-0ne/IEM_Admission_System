import { AppError } from '../errors.js';
import config from '../config.js';

export function errorHandler(err, req, res, next) {
  // If response has already started streaming, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError' && Array.isArray(err.issues)) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details,
      },
    });
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
        details: { field: err.field },
      },
    });
  }

  // Unexpected / unhandled errors
  console.error('Unhandled server error:', err);

  const isDev = config.nodeEnv === 'development' || config.nodeEnv === 'test';
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message || 'Internal server error' : 'Internal server error',
      details: isDev && err.stack ? { stack: err.stack } : null,
    },
  });
}

export default errorHandler;

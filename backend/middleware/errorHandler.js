const { ActivityLog } = require('../models');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Error handler middleware
const errorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to database
  try {
    await ActivityLog.create({
      action: 'error',
      entityType: 'system',
      description: err.message,
      severity: err.statusCode >= 500 ? 'critical' : 'high',
      errorMessage: err.message,
      errorStack: err.stack,
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      requestBody: req.body,
      responseStatus: err.statusCode || 500,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      metadata: {
        originalError: err.message,
        stack: err.stack
      }
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = new AppError('Referenced record does not exist', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Cast error (MongoDB)
  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400);
  }

  // Duplicate key error (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`Duplicate field value: ${field}`, 400);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Unexpected file field', 400);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        statusCode,
        stack: err.stack,
        details: err
      }
    });
  } else {
    // Production error response
    if (statusCode === 500) {
      res.status(statusCode).json({
        success: false,
        message: 'Internal Server Error'
      });
    } else {
      res.status(statusCode).json({
        success: false,
        message
      });
    }
  }
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler
}; 
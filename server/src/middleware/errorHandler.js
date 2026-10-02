const ApiResponse = require('../utils/apiResponse');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  console.error(`[Error Log] Path: ${req.path} | Error: ${err.message}`, err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return ApiResponse.error(res, 'Validation Error', 400, 'VALIDATION_ERROR', errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, `Duplicate entry for ${field}`, 409, 'DUPLICATE_KEY_ERROR');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token provided', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token has expired', 401, 'TOKEN_EXPIRED');
  }

  // Generic internal server error
  const message = env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  if (err.errors) console.error('Details:', err.errors);
  if (err.missingFields) console.error('Missing fields:', err.missingFields);

  return ApiResponse.error(res, message, err.statusCode || 500, err.errorCode || 'INTERNAL_ERROR', err.errors);
};

module.exports = errorHandler;

const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';


  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    statusCode: err.statusCode,
  });


  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    err = new AppError(message, 400);
  }


  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    err = new AppError(message.join(', '), 400);
  }


  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again!';
    err = new AppError(message, 401);
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired! Please log in again.';
    err = new AppError(message, 401);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler, AppError };

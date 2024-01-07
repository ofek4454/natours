const AppError = require('../utils/appError');

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
  let val = '{';
  Object.entries(err.keyValue).forEach(([key, value]) => {
    val += ` ${key} : ${value} ,`;
  });
  val = val.slice(0, val.length - 2);
  val += '}';
  const message = `Duplicate field value: ${val}, please use another value`;
  return new AppError(message, 400);
};

const handleValidaitonError = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);

  const message = `Invalid input data. ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => new AppError(err.message, 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api'))
    // API
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  // WEBSITE
  else
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to the client.
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational)
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    // Proggraming or other unknown error: don't leak error details

    // 1) Log error
    // eslint-disable-next-line no-console
    console.log('ERROR 💥', err);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }

  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    const { name, message, statusCode, status, isOperational } = err;

    // Create a new object with the desired properties
    let error = { name, message, statusCode, status, isOperational };

    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateFields(error);
    if (error.name === 'ValidationError') error = handleValidaitonError(error);
    if (error.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      error = handleJWTError(error);
    sendErrorProd(error, req, res);
  }
};

export function errorHandler(err, req, res, next) {
  console.error('[CampusSlot API Error]:', err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const errorCode = err.code || err.name || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected server error occurred',
    errorCode,
  });
}

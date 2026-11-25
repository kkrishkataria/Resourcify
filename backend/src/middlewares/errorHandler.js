export function errorHandler(err, req, res, next) {
  console.error('[CampusSlot API Error]:', err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const errorCode = err.errorCode || err.code || err.name || 'INTERNAL_SERVER_ERROR';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected server error occurred',
    errorCode,
  });
}

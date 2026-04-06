function errorHandler(err, req, res, next) {
  console.error('Unexpected error:', err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).render('error', {
    title: 'Internal Server Error',
    message: 'Something went wrong on the server.',
    error: process.env.NODE_ENV === 'development' ? err : null,
  });
}

export default errorHandler;

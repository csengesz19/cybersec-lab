export function requireAuthPage(req, res, next) {
  if (req.session?.user) return next();
  const nextUrl = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/login?next=${nextUrl}`);
}

export function requireAuthApi(req, res, next) {
  if (req.session?.user) return next();
  return res.status(401).json({ ok: false, error: 'Not logged in' });
}

export function requireAdminPage(req, res, next) {
  if (req.session?.user?.isAdmin) return next();
  return res.status(403).render('error', {
    title: 'Forbidden',
    message: 'Admin access required.',
    error: null,
  });
}

export function requireAdminApi(req, res, next) {
  if (req.session?.user?.isAdmin) return next();
  return res.status(403).json({ ok: false, error: 'Admin access required.' });
}

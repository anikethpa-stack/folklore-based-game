/**
 * Role-Based Authorization: Restricts route to administrators only.
 * Must be preceded by the protect middleware.
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required.',
    code: 'FORBIDDEN',
  });
};

module.exports = { requireAdmin };


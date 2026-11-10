const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: Strictly validates JWT access token from Authorization header.
 * Rejects with 401 if token is missing, expired, or invalid.
 * Attaches the authenticated user to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify the JWT access token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // Retrieve user from DB, excluding password hash
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
          code: 'USER_NOT_FOUND',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired. Please refresh your session.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token.',
        code: 'TOKEN_INVALID',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Authentication required to access this resource.',
      code: 'NO_TOKEN',
    });
  }
};

/**
 * Optional Authentication:
 * If an Authorization Bearer token is provided, validates it and attaches req.user.
 * If no token is provided, proceeds with req.user = null (allowing guest access where appropriate).
 * If an invalid or expired token is explicitly passed, rejects with 401.
 */
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (user) {
        req.user = user;
      }
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired. Please refresh your session.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token.',
        code: 'TOKEN_INVALID',
      });
    }
  }

  req.user = null;
  return next();
};

module.exports = { protect, optionalAuth };

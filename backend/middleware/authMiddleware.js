const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: Validates JWT access token from Authorization header.
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
      message: 'Not authorized. No access token provided.',
      code: 'NO_TOKEN',
    });
  }
};

module.exports = { protect };


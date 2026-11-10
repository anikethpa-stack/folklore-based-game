const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate a short-lived JWT access token
 * Payload contains user ID, username, and role
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    }
  );
};

/**
 * Generate a cryptographically secure random refresh token string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash a refresh token using SHA-256 before saving to MongoDB
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Cookie options for setting the HttpOnly refresh token cookie
 */
const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Prevents client-side script access (mitigating XSS)
    secure: isProduction, // Set to true on HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // Protect against CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/auth', // Restrict cookie to the authentication endpoints
  };
};

/**
 * Cookie options for clearing the refresh token cookie upon logout or invalidation
 */
const getClearCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth',
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshCookieOptions,
  getClearCookieOptions,
};

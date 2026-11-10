const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshCookieOptions,
  getClearCookieOptions,
} = require('../utils/tokenUtils');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: username, email, and password.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  // Check if username or email already exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
  });

  if (existingUser) {
    const isEmailTaken = existingUser.email === email.toLowerCase();
    return res.status(409).json({
      success: false,
      message: isEmailTaken
        ? 'An account with this email address already exists.'
        : 'This username is already taken. Please choose another.',
    });
  }

  // Create new user (password is automatically hashed by pre-save hook)
  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase(),
    passwordHash: password,
    // First user can optionally be made admin or regular user
    role: 'user',
    profile: {
      displayName: username.trim(),
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(rawRefreshToken);

  // Persist refresh session in MongoDB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshSession.create({
    userId: user._id,
    tokenHash: hashedRefreshToken,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
    expiresAt,
  });

  // Set Secure, HttpOnly refresh cookie
  res.cookie('refreshToken', rawRefreshToken, getRefreshCookieOptions());

  return res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    accessToken,
    user: user.toSafeObject(),
  });
};

/**
 * @desc    Authenticate user and get access token + refresh cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be username or email

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your username/email and password.',
    });
  }

  // Find user by username or email, including passwordHash for comparison
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase().trim() },
      { username: identifier.trim() },
    ],
  }).select('+passwordHash');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username/email or password.',
    });
  }

  // Issue access token and new refresh session
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(rawRefreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshSession.create({
    userId: user._id,
    tokenHash: hashedRefreshToken,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
    expiresAt,
  });

  // Set Secure, HttpOnly cookie
  res.cookie('refreshToken', rawRefreshToken, getRefreshCookieOptions());

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    accessToken,
    user: user.toSafeObject(),
  });
};

/**
 * @desc    Silent token refresh using HttpOnly cookie
 * @route   POST /api/auth/refresh
 * @access  Public (via cookie)
 */
const refresh = async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not found in cookies.',
      code: 'NO_REFRESH_TOKEN',
    });
  }

  const hashedRefreshToken = hashToken(rawRefreshToken);

  // Locate the active refresh session in MongoDB
  const session = await RefreshSession.findOne({
    tokenHash: hashedRefreshToken,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    // Clear potentially invalid or compromised cookie
    res.clearCookie('refreshToken', getClearCookieOptions());
    return res.status(401).json({
      success: false,
      message: 'Refresh session expired or revoked.',
      code: 'INVALID_REFRESH_SESSION',
    });
  }

  // Find the associated user
  const user = await User.findById(session.userId);
  if (!user) {
    res.clearCookie('refreshToken', getClearCookieOptions());
    return res.status(401).json({
      success: false,
      message: 'User belonging to this session does not exist.',
    });
  }

  // Token Rotation: Revoke previous session
  session.isRevoked = true;
  session.revokedAt = new Date();
  await session.save();

  // Create brand new refresh token & session
  const newRawRefreshToken = generateRefreshToken();
  const newHashedRefreshToken = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshSession.create({
    userId: user._id,
    tokenHash: newHashedRefreshToken,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
    expiresAt,
  });

  const newAccessToken = generateAccessToken(user);

  // Send updated cookie
  res.cookie('refreshToken', newRawRefreshToken, getRefreshCookieOptions());

  return res.status(200).json({
    success: true,
    accessToken: newAccessToken,
    user: user.toSafeObject(),
  });
};

/**
 * @desc    Logout user and invalidate refresh session
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (rawRefreshToken) {
    const hashedRefreshToken = hashToken(rawRefreshToken);
    await RefreshSession.updateOne(
      { tokenHash: hashedRefreshToken },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  // Clear the HttpOnly cookie
  res.clearCookie('refreshToken', getRefreshCookieOptions());

  return res.status(200).json({
    success: true,
    message: 'Successfully logged out.',
  });
};

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (Bearer token)
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};

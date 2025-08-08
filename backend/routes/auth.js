const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const { 
  generateToken, 
  verifyRefreshToken, 
  setTokenCookies, 
  clearTokenCookies,
  authenticate,
  requireBuyer
} = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { User } = require('../models');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Validation schemas
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('role').optional().isIn(['buyer', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { email, password, firstName, lastName, role = 'buyer', shippingAddress, billingAddress, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role,
    shippingAddress,
    billingAddress,
    phone,
    isEmailVerified: false,
    emailVerificationToken: crypto.randomBytes(32).toString('hex')
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateToken(user.id, user.role);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Log activity
  await logManualActivity({
    userId: user.id,
    action: 'user.register',
    entityType: 'user',
    entityId: user.id,
    description: 'New user registered',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
}));

// Login user
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  await user.update({ lastLogin: new Date() });

  // Generate tokens
  const { accessToken, refreshToken } = generateToken(user.id, user.role);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Log activity
  await logManualActivity({
    userId: user.id,
    action: 'user.login',
    entityType: 'user',
    entityId: user.id,
    description: 'User logged in',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
}));

// Logout user
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // Clear cookies
  clearTokenCookies(res);

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'user.logout',
    entityType: 'user',
    entityId: req.user.id,
    description: 'User logged out',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateToken(user.id, user.role);

    // Set new cookies
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
}));

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  asyncHandler(async (req, res) => {
    const user = req.user;

    // Generate tokens
    const { accessToken, refreshToken } = generateToken(user.id, user.role);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Log activity
    await logManualActivity({
      userId: user.id,
      action: 'user.login',
      entityType: 'user',
      entityId: user.id,
      description: 'User logged in via Google OAuth',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  })
);

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user) {
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires
    });

    // TODO: Send email with reset link
    // For now, just return the token (in production, send email)
    res.json({
      success: true,
      message: 'Password reset email sent',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    });
  } else {
    // Don't reveal if user exists
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset email has been sent'
    });
  }
}));

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { token, password } = req.body;

  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() }
    }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Update password and clear reset token
  await user.update({
    password,
    resetPasswordToken: null,
    resetPasswordExpires: null
  });

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// Verify email
router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    where: { emailVerificationToken: token }
  });

  if (!user) {
    throw new AppError('Invalid verification token', 400);
  }

  await user.update({
    isEmailVerified: true,
    emailVerificationToken: null
  });

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// Resend verification email
router.post('/resend-verification', authenticate, asyncHandler(async (req, res) => {
  if (req.user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  await req.user.update({ emailVerificationToken: verificationToken });

  // TODO: Send verification email
  res.json({
    success: true,
    message: 'Verification email sent',
    data: {
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    }
  });
}));

// Update profile
router.put('/profile', authenticate, requireBuyer, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { firstName, lastName, phone, shippingAddress, billingAddress } = req.body;

  await req.user.update({
    firstName,
    lastName,
    phone,
    shippingAddress,
    billingAddress
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'user.update',
    entityType: 'user',
    entityId: req.user.id,
    description: 'User profile updated',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: req.user.toJSON()
    }
  });
}));

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { currentPassword, newPassword } = req.body;

  // Verify current password
  const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  await req.user.update({ password: newPassword });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'user.update',
    entityType: 'user',
    entityId: req.user.id,
    description: 'User password changed',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

module.exports = router; 
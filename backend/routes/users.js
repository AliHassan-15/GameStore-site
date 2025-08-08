const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { User, Order, Review, CartItem } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation schemas
const userUpdateValidation = [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please provide a valid date')
];

// Get user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      {
        model: Order,
        as: 'orders',
        attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
        limit: 5,
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  res.json({
    success: true,
    data: { user }
  });
}));

// Update user profile
router.put('/profile', authenticate, userUpdateValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { firstName, lastName, phone, dateOfBirth, shippingAddress, billingAddress } = req.body;

  // Store old values for logging
  const oldValues = req.user.toJSON();

  // Update user
  await req.user.update({
    firstName,
    lastName,
    phone,
    dateOfBirth,
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
    oldValues,
    newValues: req.user.toJSON(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: req.user.toJSON() }
  });
}));

// Get user orders
router.get('/orders', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = { userId: req.user.id };
  if (status) {
    whereClause.status = status;
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

// Get user reviews
router.get('/reviews', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

// Get user statistics
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const totalOrders = await Order.count({ where: { userId: req.user.id } });
  const totalReviews = await Review.count({ where: { userId: req.user.id } });
  const totalSpent = await Order.sum('total', { 
    where: { 
      userId: req.user.id,
      paymentStatus: 'paid'
    }
  });

  // Recent activity
  const recentOrders = await Order.findAll({
    where: { userId: req.user.id },
    attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  const recentReviews = await Review.findAll({
    where: { userId: req.user.id },
    attributes: ['id', 'rating', 'title', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  res.json({
    success: true,
    data: {
      totalOrders,
      totalReviews,
      totalSpent: parseFloat(totalSpent || 0),
      recentOrders,
      recentReviews
    }
  });
}));

// Admin: Get all users
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (role) whereClause.role = role;
  if (isActive !== undefined) whereClause.isActive = isActive === 'true';
  if (search) {
    whereClause[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password', 'emailVerificationToken', 'resetPasswordToken'] },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

// Admin: Get user details
router.get('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password', 'emailVerificationToken', 'resetPasswordToken'] },
    include: [
      {
        model: Order,
        as: 'orders',
        attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      },
      {
        model: Review,
        as: 'reviews',
        attributes: ['id', 'rating', 'title', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      }
    ]
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Admin: Update user
router.put('/admin/:id', authenticate, requireAdmin, userUpdateValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { firstName, lastName, phone, dateOfBirth, role, isActive, shippingAddress, billingAddress } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Store old values for logging
  const oldValues = user.toJSON();

  // Update user
  await user.update({
    firstName,
    lastName,
    phone,
    dateOfBirth,
    role,
    isActive,
    shippingAddress,
    billingAddress
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'user.update',
    entityType: 'user',
    entityId: user.id,
    description: `Admin updated user ${user.email}`,
    oldValues,
    newValues: user.toJSON(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: user.toJSON() }
  });
}));

// Admin: Delete user
router.delete('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if user has orders
  const orderCount = await Order.count({ where: { userId: id } });
  if (orderCount > 0) {
    throw new AppError('Cannot delete user with existing orders', 400);
  }

  // Log activity before deletion
  await logManualActivity({
    userId: req.user.id,
    action: 'user.delete',
    entityType: 'user',
    entityId: user.id,
    description: `Admin deleted user ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Soft delete (set isActive to false)
  await user.update({ isActive: false });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// Admin: Get user statistics
router.get('/admin/stats/overview', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { isActive: true } });
  const buyers = await User.count({ where: { role: 'buyer' } });
  const admins = await User.count({ where: { role: 'admin' } });

  // Users with orders
  const usersWithOrders = await User.count({
    include: [
      {
        model: Order,
        as: 'orders',
        required: true
      }
    ]
  });

  // Recent registrations
  const recentUsers = await User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 10
  });

  // Top customers by spending
  const topCustomers = await User.findAll({
    include: [
      {
        model: Order,
        as: 'orders',
        where: { paymentStatus: 'paid' },
        required: false,
        attributes: []
      }
    ],
    attributes: [
      'id',
      'firstName',
      'lastName',
      'email',
      [require('sequelize').fn('SUM', require('sequelize').col('orders.total')), 'totalSpent']
    ],
    group: ['User.id'],
    having: require('sequelize').literal('SUM(orders.total) > 0'),
    order: [[require('sequelize').fn('SUM', require('sequelize').col('orders.total')), 'DESC']],
    limit: 5
  });

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      buyers,
      admins,
      usersWithOrders,
      recentUsers,
      topCustomers
    }
  });
}));

// Admin: Get user activity
router.get('/admin/:id/activity', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user's orders
  const { count: orderCount, rows: orders } = await Order.findAndCountAll({
    where: { userId: id },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Get user's reviews
  const { count: reviewCount, rows: reviews } = await Review.findAndCountAll({
    where: { userId: id },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const totalPages = Math.ceil(Math.max(orderCount, reviewCount) / limit);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      orders,
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: Math.max(orderCount, reviewCount),
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

module.exports = router; 
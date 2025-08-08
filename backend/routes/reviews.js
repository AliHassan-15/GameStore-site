const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireBuyer, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { Review, Product, User, Order, OrderItem, ReviewVote } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation schemas
const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('comment').optional().isLength({ min: 10 }).withMessage('Comment must be at least 10 characters long'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean')
];

// Get reviews for a product
router.get('/product/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, rating, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const whereClause = { 
    productId, 
    status: 'approved' 
  };

  if (rating) {
    whereClause.rating = parseInt(rating);
  }

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      }
    ],
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Calculate rating distribution
  const ratingDistribution = await Review.findAll({
    where: { productId, status: 'approved' },
    attributes: [
      'rating',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['rating'],
    raw: true
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
      },
      ratingDistribution,
      product: {
        id: product.id,
        name: product.name,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount
      }
    }
  });
}));

// Get user's reviews
router.get('/user', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'mainImage']
      }
    ],
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

// Create review
router.post('/', authenticate, requireBuyer, reviewValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { productId, rating, title, comment, isAnonymous = false, images } = req.body;

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user has already reviewed this product
  const existingReview = await Review.findOne({
    where: { userId: req.user.id, productId }
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this product', 400);
  }

  // Check if user has purchased the product (optional verification)
  const hasPurchased = await OrderItem.findOne({
    where: { productId },
    include: [
      {
        model: Order,
        as: 'order',
        where: { 
          userId: req.user.id,
          status: 'delivered'
        }
      }
    ]
  });

  // Create review
  const review = await Review.create({
    userId: req.user.id,
    productId,
    rating,
    title,
    comment,
    isAnonymous,
    images: images || [],
    verifiedPurchase: !!hasPurchased,
    platform: req.get('User-Agent'),
    ipAddress: req.ip
  });

  // Update product rating statistics
  await updateProductRatingStats(productId);

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'review.create',
    entityType: 'review',
    entityId: review.id,
    description: `Created review for ${product.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: { review }
  });
}));

// Update review
router.put('/:id', authenticate, requireBuyer, reviewValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { rating, title, comment, isAnonymous, images } = req.body;

  const review = await Review.findOne({
    where: { id, userId: req.user.id },
    include: [
      {
        model: Product,
        as: 'product'
      }
    ]
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.status !== 'pending' && review.status !== 'approved') {
    throw new AppError('Cannot update this review', 400);
  }

  // Store old values for logging
  const oldValues = review.toJSON();

  // Update review
  await review.update({
    rating,
    title,
    comment,
    isAnonymous,
    images: images || review.images,
    status: 'pending' // Reset to pending for admin approval
  });

  // Update product rating statistics
  await updateProductRatingStats(review.productId);

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'review.update',
    entityType: 'review',
    entityId: review.id,
    description: `Updated review for ${review.product.name}`,
    oldValues,
    newValues: review.toJSON(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: { review }
  });
}));

// Delete review
router.delete('/:id', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findOne({
    where: { id, userId: req.user.id },
    include: [
      {
        model: Product,
        as: 'product'
      }
    ]
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Log activity before deletion
  await logManualActivity({
    userId: req.user.id,
    action: 'review.delete',
    entityType: 'review',
    entityId: review.id,
    description: `Deleted review for ${review.product.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await review.destroy();

  // Update product rating statistics
  await updateProductRatingStats(review.productId);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}));

// Vote on review (helpful/unhelpful)
router.post('/:id/vote', authenticate, requireBuyer, [
  body('voteType').isIn(['helpful', 'unhelpful']).withMessage('Vote type must be helpful or unhelpful')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { voteType } = req.body;

  const review = await Review.findByPk(id);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Check if user has already voted
  const existingVote = await ReviewVote.findOne({
    where: { reviewId: id, userId: req.user.id }
  });

  if (existingVote) {
    // Update existing vote
    await existingVote.update({ voteType });
  } else {
    // Create new vote
    await ReviewVote.create({
      reviewId: id,
      userId: req.user.id,
      voteType,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Update review vote counts
  const helpfulVotes = await ReviewVote.count({
    where: { reviewId: id, voteType: 'helpful' }
  });

  const totalVotes = await ReviewVote.count({
    where: { reviewId: id }
  });

  await review.update({
    helpfulVotes,
    totalVotes
  });

  res.json({
    success: true,
    message: 'Vote recorded successfully',
    data: { review }
  });
}));

// Admin: Get all reviews
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, rating, productId } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (status) whereClause.status = status;
  if (rating) whereClause.rating = parseInt(rating);
  if (productId) whereClause.productId = productId;

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug']
      }
    ],
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

// Admin: Update review status
router.put('/admin/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Valid status is required'),
  body('adminResponse').optional().isString().withMessage('Admin response must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { status, adminResponse } = req.body;

  const review = await Review.findByPk(id, {
    include: [
      {
        model: Product,
        as: 'product'
      }
    ]
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const oldStatus = review.status;

  // Update review
  await review.update({
    status,
    adminResponse: adminResponse || null,
    adminResponseDate: adminResponse ? new Date() : null
  });

  // Update product rating statistics if status changed
  if (oldStatus !== status) {
    await updateProductRatingStats(review.productId);
  }

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'review.update',
    entityType: 'review',
    entityId: review.id,
    description: `Updated review status to ${status} for ${review.product.name}`,
    oldValues: { status: oldStatus },
    newValues: { status },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Review status updated successfully',
    data: { review }
  });
}));

// Admin: Delete review
router.delete('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findByPk(id, {
    include: [
      {
        model: Product,
        as: 'product'
      }
    ]
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Log activity before deletion
  await logManualActivity({
    userId: req.user.id,
    action: 'review.delete',
    entityType: 'review',
    entityId: review.id,
    description: `Admin deleted review for ${review.product.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await review.destroy();

  // Update product rating statistics
  await updateProductRatingStats(review.productId);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}));

// Get review statistics (Admin only)
router.get('/admin/stats/overview', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const totalReviews = await Review.count();
  const pendingReviews = await Review.count({ where: { status: 'pending' } });
  const approvedReviews = await Review.count({ where: { status: 'approved' } });
  const rejectedReviews = await Review.count({ where: { status: 'rejected' } });

  // Average rating
  const avgRatingResult = await Review.findOne({
    where: { status: 'approved' },
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'averageRating']
    ],
    raw: true
  });

  const averageRating = parseFloat(avgRatingResult?.averageRating || 0);

  // Rating distribution
  const ratingDistribution = await Review.findAll({
    where: { status: 'approved' },
    attributes: [
      'rating',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['rating'],
    order: [['rating', 'DESC']],
    raw: true
  });

  // Recent reviews
  const recentReviews = await Review.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['name']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  res.json({
    success: true,
    data: {
      totalReviews,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      averageRating,
      ratingDistribution,
      recentReviews
    }
  });
}));

// Helper function to update product rating statistics
async function updateProductRatingStats(productId) {
  const stats = await Review.findOne({
    where: { productId, status: 'approved' },
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'averageRating'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'reviewCount']
    ],
    raw: true
  });

  await Product.update({
    averageRating: parseFloat(stats?.averageRating || 0),
    reviewCount: parseInt(stats?.reviewCount || 0)
  }, {
    where: { id: productId }
  });
}

module.exports = router; 
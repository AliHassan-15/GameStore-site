const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { Product, Category, Review, User, ProductImage } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Validation schemas
const productValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Product name must be at least 3 characters long'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('platform').optional().isIn(['PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Nintendo Switch', 'Mobile', 'Multi-platform']),
  body('ageRating').optional().isIn(['E', 'E10+', 'T', 'M', 'AO'])
];

// Get all products (with search, filtering, pagination)
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    subcategory,
    platform,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    inStock,
    featured,
    brand
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { isActive: true };

  // Search functionality
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { brand: { [Op.iLike]: `%${search}%` } },
      { publisher: { [Op.iLike]: `%${search}%` } },
      { developer: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Category filter
  if (category) {
    whereClause.categoryId = category;
  }

  // Subcategory filter
  if (subcategory) {
    whereClause.subcategoryId = subcategory;
  }

  // Platform filter
  if (platform) {
    whereClause.platform = platform;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
  }

  // Stock filter
  if (inStock === 'true') {
    whereClause.stockQuantity = { [Op.gt]: 0 };
  }

  // Featured filter
  if (featured === 'true') {
    whereClause.isFeatured = true;
  }

  // Brand filter
  if (brand) {
    whereClause.brand = { [Op.iLike]: `%${brand}%` };
  }

  // Sorting
  const orderClause = [[sortBy, sortOrder.toUpperCase()]];

  // Include associations
  const include = [
    {
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'slug']
    },
    {
      model: Category,
      as: 'subcategory',
      attributes: ['id', 'name', 'slug']
    },
    {
      model: ProductImage,
      as: 'productImages',
      where: { isActive: true },
      required: false,
      order: [['sortOrder', 'ASC']]
    }
  ];

  // Get products with pagination
  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    include,
    order: orderClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    }
  });
}));

// Get single product by ID or slug
router.get('/:identifier', optionalAuth, asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

  const whereClause = isUUID ? { id: identifier } : { slug: identifier };
  whereClause.isActive = true;

  const product = await Product.findOne({
    where: whereClause,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: Category,
        as: 'subcategory',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: ProductImage,
        as: 'productImages',
        where: { isActive: true },
        required: false,
        order: [['sortOrder', 'ASC']]
      },
      {
        model: Review,
        as: 'reviews',
        where: { status: 'approved' },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      }
    ]
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Increment view count
  await product.increment('viewCount');

  // Log view activity
  if (req.user) {
    await logManualActivity({
      userId: req.user.id,
      action: 'product.view',
      entityType: 'product',
      entityId: product.id,
      description: `Viewed product: ${product.name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  res.json({
    success: true,
    data: { product }
  });
}));

// Create new product (Admin only)
router.post('/', authenticate, requireAdmin, productValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const {
    name,
    description,
    shortDescription,
    price,
    compareAtPrice,
    costPrice,
    sku,
    barcode,
    stockQuantity,
    lowStockThreshold,
    weight,
    dimensions,
    categoryId,
    subcategoryId,
    brand,
    platform,
    genre,
    ageRating,
    releaseDate,
    publisher,
    developer,
    isFeatured,
    isDigital,
    isPhysical,
    metaTitle,
    metaDescription,
    tags,
    specifications
  } = req.body;

  // Check if SKU already exists
  const existingProduct = await Product.findOne({ where: { sku } });
  if (existingProduct) {
    throw new AppError('Product with this SKU already exists', 400);
  }

  // Generate slug from name
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug already exists
  const existingSlug = await Product.findOne({ where: { slug } });
  if (existingSlug) {
    throw new AppError('Product with this name already exists', 400);
  }

  // Create product
  const product = await Product.create({
    name,
    slug,
    description,
    shortDescription,
    price,
    compareAtPrice,
    costPrice,
    sku,
    barcode,
    stockQuantity,
    lowStockThreshold,
    weight,
    dimensions,
    categoryId,
    subcategoryId,
    brand,
    platform,
    genre,
    ageRating,
    releaseDate,
    publisher,
    developer,
    isFeatured,
    isDigital,
    isPhysical,
    metaTitle,
    metaDescription,
    tags,
    specifications
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'product.create',
    entityType: 'product',
    entityId: product.id,
    description: `Created product: ${product.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
}));

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, productValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const product = await Product.findByPk(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Store old values for logging
  const oldValues = product.toJSON();

  // Update product
  await product.update(req.body);

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'product.update',
    entityType: 'product',
    entityId: product.id,
    description: `Updated product: ${product.name}`,
    oldValues,
    newValues: product.toJSON(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
}));

// Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByPk(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Soft delete (set isActive to false)
  await product.update({ isActive: false });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'product.delete',
    entityType: 'product',
    entityId: product.id,
    description: `Deleted product: ${product.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
}));

// Get product analytics (Admin only)
router.get('/:id/analytics', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Review,
        as: 'reviews',
        attributes: ['rating', 'createdAt']
      }
    ]
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Calculate analytics
  const totalReviews = product.reviews.length;
  const averageRating = totalReviews > 0 
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  const ratingDistribution = {
    5: product.reviews.filter(r => r.rating === 5).length,
    4: product.reviews.filter(r => r.rating === 4).length,
    3: product.reviews.filter(r => r.rating === 3).length,
    2: product.reviews.filter(r => r.rating === 2).length,
    1: product.reviews.filter(r => r.rating === 1).length
  };

  res.json({
    success: true,
    data: {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        viewCount: product.viewCount,
        soldCount: product.soldCount,
        averageRating,
        reviewCount: totalReviews
      },
      analytics: {
        totalReviews,
        averageRating,
        ratingDistribution,
        stockStatus: product.isInStock() ? 'In Stock' : 'Out of Stock',
        lowStock: product.isLowStock()
      }
    }
  });
}));

// Get related products
router.get('/:id/related', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByPk(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const relatedProducts = await Product.findAll({
    where: {
      id: { [Op.ne]: id },
      isActive: true,
      [Op.or]: [
        { categoryId: product.categoryId },
        { subcategoryId: product.subcategoryId },
        { brand: product.brand },
        { platform: product.platform }
      ]
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: ProductImage,
        as: 'productImages',
        where: { isActive: true, isMain: true },
        required: false
      }
    ],
    order: [['viewCount', 'DESC']],
    limit: 8
  });

  res.json({
    success: true,
    data: { relatedProducts }
  });
}));

// Get product brands
router.get('/brands/list', asyncHandler(async (req, res) => {
  const brands = await Product.findAll({
    attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('brand')), 'brand']],
    where: {
      brand: { [Op.not]: null },
      isActive: true
    },
    raw: true
  });

  const brandList = brands
    .map(item => item.brand)
    .filter(Boolean)
    .sort();

  res.json({
    success: true,
    data: { brands: brandList }
  });
}));

// Get product platforms
router.get('/platforms/list', asyncHandler(async (req, res) => {
  const platforms = await Product.findAll({
    attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('platform')), 'platform']],
    where: {
      platform: { [Op.not]: null },
      isActive: true
    },
    raw: true
  });

  const platformList = platforms
    .map(item => item.platform)
    .filter(Boolean)
    .sort();

  res.json({
    success: true,
    data: { platforms: platformList }
  });
}));

module.exports = router; 
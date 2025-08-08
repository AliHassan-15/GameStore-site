const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireBuyer } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { CartItem, Product, User } = require('../models');

const router = express.Router();

// Validation schemas
const cartItemValidation = [
  body('productId').isUUID().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// Get user's cart
router.get('/', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const cartItems = await CartItem.findAll({
    where: { 
      userId: req.user.id,
      expiresAt: { [require('sequelize').Op.or]: [null, { [require('sequelize').Op.gt]: new Date() }] }
    },
    include: [
      {
        model: Product,
        as: 'product',
        where: { isActive: true },
        attributes: [
          'id', 'name', 'slug', 'price', 'compareAtPrice', 'mainImage', 
          'stockQuantity', 'isDigital', 'isPhysical'
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Calculate totals
  let subtotal = 0;
  let itemCount = 0;

  const processedItems = cartItems.map(item => {
    const itemTotal = item.priceAtAdd * item.quantity;
    subtotal += itemTotal;
    itemCount += item.quantity;

    return {
      ...item.toJSON(),
      itemTotal,
      isInStock: item.product.stockQuantity > 0,
      canPurchase: item.product.stockQuantity >= item.quantity
    };
  });

  res.json({
    success: true,
    data: {
      items: processedItems,
      summary: {
        itemCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalItems: cartItems.length
      }
    }
  });
}));

// Add item to cart
router.post('/add', authenticate, requireBuyer, cartItemValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { productId, quantity = 1, notes } = req.body;

  // Check if product exists and is active
  const product = await Product.findOne({
    where: { id: productId, isActive: true }
  });

  if (!product) {
    throw new AppError('Product not found or unavailable', 404);
  }

  // Check stock availability
  if (product.stockQuantity < quantity) {
    throw new AppError(`Only ${product.stockQuantity} items available in stock`, 400);
  }

  // Check if item already exists in cart
  const existingCartItem = await CartItem.findOne({
    where: { userId: req.user.id, productId }
  });

  if (existingCartItem) {
    // Update quantity if item already exists
    const newQuantity = existingCartItem.quantity + quantity;
    
    if (product.stockQuantity < newQuantity) {
      throw new AppError(`Cannot add ${quantity} more items. Only ${product.stockQuantity - existingCartItem.quantity} additional items available`, 400);
    }

    await existingCartItem.update({
      quantity: newQuantity,
      priceAtAdd: product.price, // Update price in case it changed
      notes: notes || existingCartItem.notes
    });

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'cart.update',
      entityType: 'cart',
      entityId: existingCartItem.id,
      description: `Updated cart item quantity for ${product.name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: { cartItem: existingCartItem }
    });
  } else {
    // Create new cart item
    const cartItem = await CartItem.create({
      userId: req.user.id,
      productId,
      quantity,
      priceAtAdd: product.price,
      notes,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'cart.add',
      entityType: 'cart',
      entityId: cartItem.id,
      description: `Added ${product.name} to cart`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cartItem }
    });
  }
}));

// Update cart item quantity
router.put('/:id', authenticate, requireBuyer, [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { quantity, notes } = req.body;

  const cartItem = await CartItem.findOne({
    where: { id, userId: req.user.id },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'stockQuantity']
      }
    ]
  });

  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }

  // Check stock availability
  if (cartItem.product.stockQuantity < quantity) {
    throw new AppError(`Only ${cartItem.product.stockQuantity} items available in stock`, 400);
  }

  // Update cart item
  await cartItem.update({
    quantity,
    notes: notes !== undefined ? notes : cartItem.notes
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'cart.update',
    entityType: 'cart',
    entityId: cartItem.id,
    description: `Updated quantity for ${cartItem.product.name}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Cart item updated successfully',
    data: { cartItem }
  });
}));

// Remove item from cart
router.delete('/:id', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cartItem = await CartItem.findOne({
    where: { id, userId: req.user.id },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['name']
      }
    ]
  });

  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }

  // Log activity before deletion
  await logManualActivity({
    userId: req.user.id,
    action: 'cart.remove',
    entityType: 'cart',
    entityId: cartItem.id,
    description: `Removed ${cartItem.product.name} from cart`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await cartItem.destroy();

  res.json({
    success: true,
    message: 'Item removed from cart successfully'
  });
}));

// Clear entire cart
router.delete('/', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const cartItems = await CartItem.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['name']
      }
    ]
  });

  if (cartItems.length === 0) {
    throw new AppError('Cart is already empty', 400);
  }

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'cart.clear',
    entityType: 'cart',
    description: `Cleared entire cart (${cartItems.length} items)`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await CartItem.destroy({ where: { userId: req.user.id } });

  res.json({
    success: true,
    message: 'Cart cleared successfully'
  });
}));

// Update cart item selection
router.patch('/:id/select', authenticate, requireBuyer, [
  body('isSelected').isBoolean().withMessage('isSelected must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { isSelected } = req.body;

  const cartItem = await CartItem.findOne({
    where: { id, userId: req.user.id }
  });

  if (!cartItem) {
    throw new AppError('Cart item not found', 404);
  }

  await cartItem.update({ isSelected });

  res.json({
    success: true,
    message: `Item ${isSelected ? 'selected' : 'deselected'} successfully`,
    data: { cartItem }
  });
}));

// Get cart summary (for checkout)
router.get('/summary', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const cartItems = await CartItem.findAll({
    where: { 
      userId: req.user.id,
      isSelected: true,
      expiresAt: { [require('sequelize').Op.or]: [null, { [require('sequelize').Op.gt]: new Date() }] }
    },
    include: [
      {
        model: Product,
        as: 'product',
        where: { isActive: true },
        attributes: [
          'id', 'name', 'slug', 'price', 'compareAtPrice', 'mainImage', 
          'stockQuantity', 'isDigital', 'isPhysical', 'weight'
        ]
      }
    ]
  });

  // Calculate totals
  let subtotal = 0;
  let itemCount = 0;
  let totalWeight = 0;
  const unavailableItems = [];

  const processedItems = cartItems.map(item => {
    const itemTotal = item.priceAtAdd * item.quantity;
    subtotal += itemTotal;
    itemCount += item.quantity;
    totalWeight += (item.product.weight || 0) * item.quantity;

    const isAvailable = item.product.stockQuantity >= item.quantity;
    if (!isAvailable) {
      unavailableItems.push({
        productId: item.product.id,
        productName: item.product.name,
        requestedQuantity: item.quantity,
        availableQuantity: item.product.stockQuantity
      });
    }

    return {
      ...item.toJSON(),
      itemTotal,
      isAvailable
    };
  });

  // Calculate shipping (basic calculation)
  const shippingAmount = totalWeight > 0 ? Math.max(5, totalWeight * 0.5) : 0;
  const taxAmount = subtotal * 0.1; // 10% tax
  const total = subtotal + shippingAmount + taxAmount;

  res.json({
    success: true,
    data: {
      items: processedItems,
      summary: {
        itemCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingAmount: parseFloat(shippingAmount.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        totalItems: cartItems.length
      },
      unavailableItems,
      canProceed: unavailableItems.length === 0
    }
  });
}));

// Merge guest cart with user cart (after login)
router.post('/merge', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const { guestCartItems } = req.body;

  if (!guestCartItems || !Array.isArray(guestCartItems)) {
    throw new AppError('Guest cart items are required', 400);
  }

  const mergedItems = [];
  const errors = [];

  for (const guestItem of guestCartItems) {
    try {
      const { productId, quantity } = guestItem;

      // Check if product exists
      const product = await Product.findOne({
        where: { id: productId, isActive: true }
      });

      if (!product) {
        errors.push(`Product ${productId} not found`);
        continue;
      }

      // Check if item already exists in user's cart
      const existingCartItem = await CartItem.findOne({
        where: { userId: req.user.id, productId }
      });

      if (existingCartItem) {
        // Update quantity
        const newQuantity = existingCartItem.quantity + quantity;
        if (product.stockQuantity >= newQuantity) {
          await existingCartItem.update({
            quantity: newQuantity,
            priceAtAdd: product.price
          });
          mergedItems.push(existingCartItem);
        } else {
          errors.push(`Insufficient stock for ${product.name}`);
        }
      } else {
        // Create new cart item
        if (product.stockQuantity >= quantity) {
          const cartItem = await CartItem.create({
            userId: req.user.id,
            productId,
            quantity,
            priceAtAdd: product.price,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
          mergedItems.push(cartItem);
        } else {
          errors.push(`Insufficient stock for ${product.name}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to merge item: ${error.message}`);
    }
  }

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'cart.merge',
    entityType: 'cart',
    description: `Merged ${mergedItems.length} guest cart items`,
    metadata: {
      mergedCount: mergedItems.length,
      errorCount: errors.length,
      errors: errors.slice(0, 5)
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: `Merged ${mergedItems.length} items successfully`,
    data: {
      mergedItems,
      errors
    }
  });
}));

module.exports = router; 
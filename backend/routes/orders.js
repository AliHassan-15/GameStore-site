const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireBuyer, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { Order, OrderItem, CartItem, Product, User, OrderStatusHistory } = require('../models');
const { Op } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Validation schemas
const orderValidation = [
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('billingAddress').isObject().withMessage('Billing address is required'),
  body('paymentMethod').isIn(['stripe', 'paypal', 'cash_on_delivery']).withMessage('Valid payment method is required'),
  body('notes').optional().isString()
];

// Get user's orders
router.get('/', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = { userId: req.user.id };
  if (status) {
    whereClause.status = status;
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'mainImage']
          }
        ]
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

// Get single order
router.get('/:id', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    where: { id, userId: req.user.id },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'mainImage', 'description']
          }
        ]
      },
      {
        model: OrderStatusHistory,
        as: 'statusHistory',
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// Create order (checkout)
router.post('/', authenticate, requireBuyer, orderValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

  // Get cart items
  const cartItems = await CartItem.findAll({
    where: { 
      userId: req.user.id,
      isSelected: true
    },
    include: [
      {
        model: Product,
        as: 'product',
        where: { isActive: true }
      }
    ]
  });

  if (cartItems.length === 0) {
    throw new AppError('No items in cart to checkout', 400);
  }

  // Validate stock and calculate totals
  let subtotal = 0;
  const orderItems = [];
  const unavailableItems = [];

  for (const cartItem of cartItems) {
    const { product, quantity } = cartItem;
    
    if (product.stockQuantity < quantity) {
      unavailableItems.push({
        productId: product.id,
        productName: product.name,
        requestedQuantity: quantity,
        availableQuantity: product.stockQuantity
      });
    } else {
      const itemTotal = cartItem.priceAtAdd * quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        productId: product.id,
        quantity,
        unitPrice: cartItem.priceAtAdd,
        totalPrice: itemTotal,
        productSnapshot: {
          name: product.name,
          price: product.price,
          sku: product.sku,
          mainImage: product.mainImage
        }
      });
    }
  }

  if (unavailableItems.length > 0) {
    throw new AppError('Some items are out of stock', 400);
  }

  // Calculate totals
  const taxAmount = subtotal * 0.1; // 10% tax
  const shippingAmount = 10; // Fixed shipping cost
  const total = subtotal + taxAmount + shippingAmount;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order
  const order = await Order.create({
    orderNumber,
    userId: req.user.id,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod,
    subtotal,
    taxAmount,
    shippingAmount,
    total,
    shippingAddress,
    billingAddress,
    notes,
    customerEmail: req.user.email,
    customerPhone: req.user.phone
  });

  // Create order items
  await OrderItem.bulkCreate(
    orderItems.map(item => ({
      ...item,
      orderId: order.id
    }))
  );

  // Update product stock
  for (const cartItem of cartItems) {
    await cartItem.product.decrement('stockQuantity', { by: cartItem.quantity });
    await cartItem.product.increment('soldCount', { by: cartItem.quantity });
  }

  // Clear cart items
  await CartItem.destroy({ where: { userId: req.user.id } });

  // Create initial status history
  await OrderStatusHistory.create({
    orderId: order.id,
    userId: req.user.id,
    toStatus: 'pending',
    isSystemGenerated: true
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'order.create',
    entityType: 'order',
    entityId: order.id,
    description: `Created order ${order.orderNumber}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
}));

// Process payment with Stripe
router.post('/:id/pay', authenticate, requireBuyer, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { paymentIntentId } = req.body;

  const order = await Order.findOne({
    where: { id, userId: req.user.id }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.paymentStatus === 'paid') {
    throw new AppError('Order is already paid', 400);
  }

  try {
    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update order
      await order.update({
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: paymentIntent.latest_charge,
        status: 'confirmed',
        confirmedAt: new Date()
      });

      // Create status history
      await OrderStatusHistory.create({
        orderId: order.id,
        userId: req.user.id,
        fromStatus: 'pending',
        toStatus: 'confirmed',
        reason: 'Payment successful',
        isSystemGenerated: true
      });

      // Log activity
      await logManualActivity({
        userId: req.user.id,
        action: 'payment.process',
        entityType: 'payment',
        entityId: order.id,
        description: `Payment processed for order ${order.orderNumber}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: { order }
      });
    } else {
      throw new AppError('Payment not completed', 400);
    }
  } catch (error) {
    // Update order status to failed
    await order.update({
      paymentStatus: 'failed',
      status: 'failed'
    });

    // Create status history
    await OrderStatusHistory.create({
      orderId: order.id,
      userId: req.user.id,
      fromStatus: 'pending',
      toStatus: 'failed',
      reason: 'Payment failed',
      isSystemGenerated: true
    });

    throw new AppError('Payment processing failed', 400);
  }
}));

// Cancel order
router.post('/:id/cancel', authenticate, requireBuyer, [
  body('reason').optional().isString().withMessage('Reason must be a string')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({
    where: { id, userId: req.user.id },
    include: [
      {
        model: OrderItem,
        as: 'items'
      }
    ]
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (!order.canBeCancelled()) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  // Update order status
  await order.update({
    status: 'cancelled',
    cancelledAt: new Date(),
    cancelReason: reason
  });

  // Restore product stock
  for (const item of order.items) {
    await Product.increment('stockQuantity', { 
      by: item.quantity,
      where: { id: item.productId }
    });
    await Product.decrement('soldCount', { 
      by: item.quantity,
      where: { id: item.productId }
    });
  }

  // Create status history
  await OrderStatusHistory.create({
    orderId: order.id,
    userId: req.user.id,
    fromStatus: order.status,
    toStatus: 'cancelled',
    reason: reason || 'Cancelled by customer',
    isSystemGenerated: false
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'order.cancel',
    entityType: 'order',
    entityId: order.id,
    description: `Cancelled order ${order.orderNumber}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order }
  });
}));

// Admin: Update order status
router.put('/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Valid status is required'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('trackingNumber').optional().isString().withMessage('Tracking number must be a string'),
  body('trackingUrl').optional().isURL().withMessage('Valid tracking URL is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { status, notes, trackingNumber, trackingUrl } = req.body;

  const order = await Order.findByPk(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const oldStatus = order.status;
  const updateData = { status };

  // Set status-specific timestamps
  switch (status) {
    case 'confirmed':
      updateData.confirmedAt = new Date();
      break;
    case 'processing':
      updateData.processedAt = new Date();
      break;
    case 'shipped':
      updateData.shippedAt = new Date();
      updateData.trackingNumber = trackingNumber;
      updateData.trackingUrl = trackingUrl;
      break;
    case 'delivered':
      updateData.deliveredAt = new Date();
      break;
  }

  // Update order
  await order.update(updateData);

  // Create status history
  await OrderStatusHistory.create({
    orderId: order.id,
    userId: req.user.id,
    fromStatus: oldStatus,
    toStatus: status,
    reason: notes,
    isSystemGenerated: false
  });

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'order.update',
    entityType: 'order',
    entityId: order.id,
    description: `Updated order ${order.orderNumber} status from ${oldStatus} to ${status}`,
    oldValues: { status: oldStatus },
    newValues: { status },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
}));

// Admin: Get all orders
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (status) whereClause.status = status;
  if (paymentStatus) whereClause.paymentStatus = paymentStatus;
  if (search) {
    whereClause[Op.or] = [
      { orderNumber: { [Op.iLike]: `%${search}%` } },
      { customerEmail: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: OrderItem,
        as: 'items',
        attributes: ['quantity', 'unitPrice', 'totalPrice']
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

// Admin: Get order details
router.get('/admin/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'mainImage', 'sku']
          }
        ]
      },
      {
        model: OrderStatusHistory,
        as: 'statusHistory',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// Get order statistics (Admin only)
router.get('/admin/stats/overview', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const totalOrders = await Order.count();
  const pendingOrders = await Order.count({ where: { status: 'pending' } });
  const confirmedOrders = await Order.count({ where: { status: 'confirmed' } });
  const shippedOrders = await Order.count({ where: { status: 'shipped' } });
  const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
  const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });

  // Total revenue
  const revenueResult = await Order.findOne({
    where: { paymentStatus: 'paid' },
    attributes: [
      [require('sequelize').fn('SUM', require('sequelize').col('total')), 'totalRevenue']
    ],
    raw: true
  });

  const totalRevenue = parseFloat(revenueResult?.totalRevenue || 0);

  // Recent orders
  const recentOrders = await Order.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      recentOrders
    }
  });
}));

module.exports = router; 
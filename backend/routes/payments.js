const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireBuyer } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { Order, User } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Create payment intent
router.post('/create-intent', authenticate, requireBuyer, [
  body('orderId').isUUID().withMessage('Valid order ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { orderId, amount } = req.body;

  // Verify order belongs to user
  const order = await Order.findOne({
    where: { id: orderId, userId: req.user.id }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.paymentStatus === 'paid') {
    throw new AppError('Order is already paid', 400);
  }

  if (order.total !== parseFloat(amount)) {
    throw new AppError('Amount does not match order total', 400);
  }

  try {
    // Create or get Stripe customer
    let customerId = req.user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: {
          userId: req.user.id
        }
      });

      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await req.user.update({ stripeCustomerId: customerId });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: req.user.id
      },
      description: `Payment for order ${order.orderNumber}`,
      receipt_email: req.user.email
    });

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'payment.intent.create',
      entityType: 'payment',
      entityId: order.id,
      description: `Created payment intent for order ${order.orderNumber}`,
      metadata: {
        paymentIntentId: paymentIntent.id,
        amount: amount
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    throw new AppError(`Payment intent creation failed: ${error.message}`, 400);
  }
}));

// Confirm payment
router.post('/confirm', authenticate, requireBuyer, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('orderId').isUUID().withMessage('Valid order ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { paymentIntentId, orderId } = req.body;

  // Verify order belongs to user
  const order = await Order.findOne({
    where: { id: orderId, userId: req.user.id }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  try {
    // Retrieve payment intent
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

      // Log activity
      await logManualActivity({
        userId: req.user.id,
        action: 'payment.confirm',
        entityType: 'payment',
        entityId: order.id,
        description: `Payment confirmed for order ${order.orderNumber}`,
        metadata: {
          paymentIntentId: paymentIntentId,
          chargeId: paymentIntent.latest_charge
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: { order }
      });
    } else {
      throw new AppError('Payment not completed', 400);
    }
  } catch (error) {
    throw new AppError(`Payment confirmation failed: ${error.message}`, 400);
  }
}));

// Get payment methods for user
router.get('/payment-methods', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  if (!req.user.stripeCustomerId) {
    return res.json({
      success: true,
      data: { paymentMethods: [] }
    });
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.user.stripeCustomerId,
      type: 'card'
    });

    res.json({
      success: true,
      data: { paymentMethods: paymentMethods.data }
    });
  } catch (error) {
    throw new AppError('Failed to retrieve payment methods', 400);
  }
}));

// Add payment method
router.post('/payment-methods', authenticate, requireBuyer, [
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { paymentMethodId } = req.body;

  if (!req.user.stripeCustomerId) {
    throw new AppError('No Stripe customer found', 400);
  }

  try {
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: req.user.stripeCustomerId
    });

    res.json({
      success: true,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    throw new AppError(`Failed to add payment method: ${error.message}`, 400);
  }
}));

// Remove payment method
router.delete('/payment-methods/:paymentMethodId', authenticate, requireBuyer, asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    throw new AppError(`Failed to remove payment method: ${error.message}`, 400);
  }
}));

// Process refund
router.post('/refund', authenticate, requireBuyer, [
  body('orderId').isUUID().withMessage('Valid order ID is required'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { orderId, amount, reason } = req.body;

  // Verify order belongs to user
  const order = await Order.findOne({
    where: { id: orderId, userId: req.user.id }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.paymentStatus !== 'paid') {
    throw new AppError('Order is not paid', 400);
  }

  if (!order.stripeChargeId) {
    throw new AppError('No payment found for this order', 400);
  }

  try {
    // Process refund
    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    
    const refund = await stripe.refunds.create({
      charge: order.stripeChargeId,
      amount: refundAmount,
      reason: reason || 'requested_by_customer',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: req.user.id
      }
    });

    // Update order status
    await order.update({
      paymentStatus: 'refunded',
      status: 'refunded'
    });

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'payment.refund',
      entityType: 'payment',
      entityId: order.id,
      description: `Refund processed for order ${order.orderNumber}`,
      metadata: {
        refundId: refund.id,
        amount: amount || order.total,
        reason: reason
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { refund, order }
    });
  } catch (error) {
    throw new AppError(`Refund processing failed: ${error.message}`, 400);
  }
}));

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}));

// Helper functions for webhook handling
async function handlePaymentIntentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  if (orderId) {
    const order = await Order.findByPk(orderId);
    if (order) {
      await order.update({
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge,
        status: 'confirmed',
        confirmedAt: new Date()
      });

      // Log activity
      await logManualActivity({
        userId: order.userId,
        action: 'payment.webhook.success',
        entityType: 'payment',
        entityId: order.id,
        description: `Payment succeeded via webhook for order ${order.orderNumber}`,
        metadata: {
          paymentIntentId: paymentIntent.id,
          chargeId: paymentIntent.latest_charge
        }
      });
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  
  if (orderId) {
    const order = await Order.findByPk(orderId);
    if (order) {
      await order.update({
        paymentStatus: 'failed',
        status: 'failed'
      });

      // Log activity
      await logManualActivity({
        userId: order.userId,
        action: 'payment.webhook.failed',
        entityType: 'payment',
        entityId: order.id,
        description: `Payment failed via webhook for order ${order.orderNumber}`,
        metadata: {
          paymentIntentId: paymentIntent.id,
          lastPaymentError: paymentIntent.last_payment_error
        }
      });
    }
  }
}

async function handleChargeRefunded(charge) {
  // Find order by charge ID
  const order = await Order.findOne({
    where: { stripeChargeId: charge.id }
  });

  if (order) {
    await order.update({
      paymentStatus: 'refunded',
      status: 'refunded'
    });

    // Log activity
    await logManualActivity({
      userId: order.userId,
      action: 'payment.webhook.refunded',
      entityType: 'payment',
      entityId: order.id,
      description: `Refund processed via webhook for order ${order.orderNumber}`,
      metadata: {
        chargeId: charge.id,
        refundId: charge.refunds?.data[0]?.id
      }
    });
  }
}

module.exports = router; 
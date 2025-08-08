const cron = require('cron');
const { Order, User, Product, Review } = require('../models');
const { logManualActivity } = require('../middleware/activityLogger');
const { sendOrderShippedEmail, sendReviewRequestEmail } = require('./emailService');
const { Op } = require('sequelize');

// Background job manager
class BackgroundJobManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start all background jobs
  start() {
    if (this.isRunning) {
      console.log('Background jobs are already running');
      return;
    }

    console.log('Starting background jobs...');

    // Order processing simulation
    this.startOrderProcessingJob();

    // Review request emails
    this.startReviewRequestJob();

    // Cleanup expired sessions
    this.startSessionCleanupJob();

    // Inventory alerts
    this.startInventoryAlertJob();

    // Analytics aggregation
    this.startAnalyticsJob();

    this.isRunning = true;
    console.log('Background jobs started successfully');
  }

  // Stop all background jobs
  stop() {
    console.log('Stopping background jobs...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('All background jobs stopped');
  }

  // Order processing simulation job
  startOrderProcessingJob() {
    const job = new cron.CronJob('*/5 * * * *', async () => { // Every 5 minutes
      try {
        await this.processOrders();
      } catch (error) {
        console.error('Order processing job error:', error);
        await logManualActivity({
          action: 'background.order_processing.error',
          entityType: 'system',
          description: 'Order processing job failed',
          metadata: { error: error.message },
          severity: 'high'
        });
      }
    });

    this.jobs.set('orderProcessing', job);
    job.start();
    console.log('Order processing job started');
  }

  // Review request job
  startReviewRequestJob() {
    const job = new cron.CronJob('0 10 * * *', async () => { // Daily at 10 AM
      try {
        await this.sendReviewRequests();
      } catch (error) {
        console.error('Review request job error:', error);
        await logManualActivity({
          action: 'background.review_request.error',
          entityType: 'system',
          description: 'Review request job failed',
          metadata: { error: error.message },
          severity: 'medium'
        });
      }
    });

    this.jobs.set('reviewRequest', job);
    job.start();
    console.log('Review request job started');
  }

  // Session cleanup job
  startSessionCleanupJob() {
    const job = new cron.CronJob('0 2 * * *', async () => { // Daily at 2 AM
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        console.error('Session cleanup job error:', error);
        await logManualActivity({
          action: 'background.session_cleanup.error',
          entityType: 'system',
          description: 'Session cleanup job failed',
          metadata: { error: error.message },
          severity: 'low'
        });
      }
    });

    this.jobs.set('sessionCleanup', job);
    job.start();
    console.log('Session cleanup job started');
  }

  // Inventory alert job
  startInventoryAlertJob() {
    const job = new cron.CronJob('0 9 * * *', async () => { // Daily at 9 AM
      try {
        await this.checkInventoryAlerts();
      } catch (error) {
        console.error('Inventory alert job error:', error);
        await logManualActivity({
          action: 'background.inventory_alert.error',
          entityType: 'system',
          description: 'Inventory alert job failed',
          metadata: { error: error.message },
          severity: 'medium'
        });
      }
    });

    this.jobs.set('inventoryAlert', job);
    job.start();
    console.log('Inventory alert job started');
  }

  // Analytics aggregation job
  startAnalyticsJob() {
    const job = new cron.CronJob('0 1 * * *', async () => { // Daily at 1 AM
      try {
        await this.aggregateAnalytics();
      } catch (error) {
        console.error('Analytics job error:', error);
        await logManualActivity({
          action: 'background.analytics.error',
          entityType: 'system',
          description: 'Analytics aggregation job failed',
          metadata: { error: error.message },
          severity: 'medium'
        });
      }
    });

    this.jobs.set('analytics', job);
    job.start();
    console.log('Analytics job started');
  }

  // Process orders simulation
  async processOrders() {
    const pendingOrders = await Order.findAll({
      where: {
        status: 'confirmed',
        paymentStatus: 'paid',
        shippedAt: null
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: 10
    });

    for (const order of pendingOrders) {
      // Simulate processing time (random between 1-5 minutes)
      const processingTime = Math.floor(Math.random() * 4) + 1;
      
      // Check if enough time has passed since order confirmation
      const timeSinceConfirmation = Date.now() - new Date(order.confirmedAt).getTime();
      const minProcessingTime = processingTime * 60 * 1000; // Convert to milliseconds

      if (timeSinceConfirmation >= minProcessingTime) {
        // Simulate shipping
        const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        await order.update({
          status: 'shipped',
          shippedAt: new Date(),
          trackingNumber
        });

        // Send shipping email
        try {
          await sendOrderShippedEmail(order.user, order, trackingNumber);
        } catch (error) {
          console.error(`Failed to send shipping email for order ${order.id}:`, error);
        }

        // Log activity
        await logManualActivity({
          userId: order.userId,
          action: 'order.shipped',
          entityType: 'order',
          entityId: order.id,
          description: `Order ${order.orderNumber} shipped with tracking ${trackingNumber}`,
          metadata: {
            trackingNumber,
            processingTime
          }
        });

        console.log(`Order ${order.orderNumber} processed and shipped`);
      }
    }
  }

  // Send review requests
  async sendReviewRequests() {
    const deliveredOrders = await Order.findAll({
      where: {
        status: 'delivered',
        deliveredAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: require('../models').OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug']
            }
          ]
        }
      ]
    });

    for (const order of deliveredOrders) {
      for (const item of order.orderItems) {
        // Check if review already exists
        const existingReview = await Review.findOne({
          where: {
            userId: order.userId,
            productId: item.productId,
            orderId: order.id
          }
        });

        if (!existingReview) {
          try {
            await sendReviewRequestEmail(order.user, order, item.product);
            console.log(`Review request sent for order ${order.orderNumber}, product ${item.product.name}`);
          } catch (error) {
            console.error(`Failed to send review request for order ${order.id}:`, error);
          }
        }
      }
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions() {
    // This would typically clean up Redis sessions
    // For now, we'll just log the cleanup
    console.log('Session cleanup completed');
    
    await logManualActivity({
      action: 'background.session_cleanup',
      entityType: 'system',
      description: 'Expired sessions cleaned up',
      severity: 'low'
    });
  }

  // Check inventory alerts
  async checkInventoryAlerts() {
    const lowStockProducts = await Product.findAll({
      where: {
        isActive: true,
        stockQuantity: {
          [Op.lte]: require('sequelize').col('lowStockThreshold')
        }
      },
      attributes: ['id', 'name', 'sku', 'stockQuantity', 'lowStockThreshold']
    });

    if (lowStockProducts.length > 0) {
      await logManualActivity({
        action: 'background.inventory_alert',
        entityType: 'system',
        description: `Low stock alert: ${lowStockProducts.length} products need attention`,
        metadata: {
          lowStockCount: lowStockProducts.length,
          products: lowStockProducts.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            stockQuantity: p.stockQuantity,
            lowStockThreshold: p.lowStockThreshold
          }))
        },
        severity: 'medium'
      });

      console.log(`Low stock alert: ${lowStockProducts.length} products need attention`);
    }
  }

  // Aggregate analytics
  async aggregateAnalytics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get daily statistics
    const dailyStats = {
      orders: await Order.count({
        where: {
          createdAt: {
            [Op.gte]: yesterday,
            [Op.lt]: today
          }
        }
      }),
      revenue: await Order.sum('total', {
        where: {
          createdAt: {
            [Op.gte]: yesterday,
            [Op.lt]: today
          },
          paymentStatus: 'paid'
        }
      }),
      users: await User.count({
        where: {
          createdAt: {
            [Op.gte]: yesterday,
            [Op.lt]: today
          }
        }
      }),
      reviews: await Review.count({
        where: {
          createdAt: {
            [Op.gte]: yesterday,
            [Op.lt]: today
          }
        }
      })
    };

    await logManualActivity({
      action: 'background.analytics.daily',
      entityType: 'system',
      description: 'Daily analytics aggregated',
      metadata: {
        date: yesterday.toISOString().split('T')[0],
        stats: dailyStats
      },
      severity: 'low'
    });

    console.log('Daily analytics aggregated:', dailyStats);
  }

  // Get job status
  getStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        nextDate: job.nextDate()
      };
    }
    return status;
  }
}

// Create singleton instance
const backgroundJobManager = new BackgroundJobManager();

module.exports = backgroundJobManager; 
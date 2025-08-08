const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { 
  User, 
  Product, 
  Order, 
  Review, 
  Category, 
  ActivityLog, 
  InventoryTransaction 
} = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Get dashboard overview
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Get basic statistics
  const totalUsers = await User.count();
  const totalProducts = await Product.count({ where: { isActive: true } });
  const totalOrders = await Order.count();
  const totalRevenue = await Order.sum('total', { 
    where: { paymentStatus: 'paid' } 
  });

  // Recent activity
  const recentOrders = await Order.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  const recentUsers = await User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

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

  // Low stock products
  const lowStockProducts = await Product.findAll({
    where: {
      isActive: true,
      stockQuantity: { [Op.lte]: require('sequelize').col('lowStockThreshold') }
    },
    attributes: ['id', 'name', 'stockQuantity', 'lowStockThreshold'],
    order: [['stockQuantity', 'ASC']],
    limit: 10
  });

  // Pending reviews
  const pendingReviews = await Review.count({ where: { status: 'pending' } });

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue || 0),
        pendingReviews
      },
      recentOrders,
      recentUsers,
      recentReviews,
      lowStockProducts
    }
  });
}));

// Get sales analytics
router.get('/analytics/sales', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Sales data
  const salesData = await Order.findAll({
    where: {
      createdAt: { [Op.gte]: daysAgo },
      paymentStatus: 'paid'
    },
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'orderCount'],
      [require('sequelize').fn('SUM', require('sequelize').col('total')), 'revenue']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
    raw: true
  });

  // Top selling products
  const topProducts = await Product.findAll({
    attributes: [
      'id',
      'name',
      'soldCount',
      [require('sequelize').fn('SUM', require('sequelize').col('orderItems.totalPrice')), 'totalRevenue']
    ],
    include: [
      {
        model: require('../models').OrderItem,
        as: 'orderItems',
        attributes: [],
        include: [
          {
            model: Order,
            as: 'order',
            where: { paymentStatus: 'paid' },
            attributes: []
          }
        ]
      }
    ],
    group: ['Product.id'],
    order: [[require('sequelize').fn('SUM', require('sequelize').col('orderItems.totalPrice')), 'DESC']],
    limit: 10,
    raw: true
  });

  // Order status distribution
  const orderStatusDistribution = await Order.findAll({
    attributes: [
      'status',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  res.json({
    success: true,
    data: {
      salesData,
      topProducts,
      orderStatusDistribution
    }
  });
}));

// Get inventory analytics
router.get('/analytics/inventory', asyncHandler(async (req, res) => {
  // Inventory overview
  const totalProducts = await Product.count({ where: { isActive: true } });
  const outOfStockProducts = await Product.count({ 
    where: { isActive: true, stockQuantity: 0 } 
  });
  const lowStockProducts = await Product.count({
    where: {
      isActive: true,
      stockQuantity: { [Op.lte]: require('sequelize').col('lowStockThreshold') },
      stockQuantity: { [Op.gt]: 0 }
    }
  });

  // Total inventory value
  const inventoryValue = await Product.sum(
    require('sequelize').literal('stockQuantity * costPrice'),
    { where: { isActive: true } }
  );

  // Recent inventory transactions
  const recentTransactions = await InventoryTransaction.findAll({
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['name', 'sku']
      },
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 20
  });

  // Transaction types distribution
  const transactionTypes = await InventoryTransaction.findAll({
    attributes: [
      'transactionType',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['transactionType'],
    raw: true
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalProducts,
        outOfStockProducts,
        lowStockProducts,
        inventoryValue: parseFloat(inventoryValue || 0)
      },
      recentTransactions,
      transactionTypes
    }
  });
}));

// Get user analytics
router.get('/analytics/users', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // User registration data
  const userRegistrations = await User.findAll({
    where: { createdAt: { [Op.gte]: daysAgo } },
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
    raw: true
  });

  // User roles distribution
  const userRoles = await User.findAll({
    attributes: [
      'role',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['role'],
    raw: true
  });

  // Top customers
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
      [require('sequelize').fn('COUNT', require('sequelize').col('orders.id')), 'orderCount'],
      [require('sequelize').fn('SUM', require('sequelize').col('orders.total')), 'totalSpent']
    ],
    group: ['User.id'],
    having: require('sequelize').literal('COUNT(orders.id) > 0'),
    order: [[require('sequelize').fn('SUM', require('sequelize').col('orders.total')), 'DESC']],
    limit: 10,
    raw: true
  });

  res.json({
    success: true,
    data: {
      userRegistrations,
      userRoles,
      topCustomers
    }
  });
}));

// Get activity logs
router.get('/activity-logs', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, severity, action, userId } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (severity) whereClause.severity = severity;
  if (action) whereClause.action = { [Op.iLike]: `%${action}%` };
  if (userId) whereClause.userId = userId;

  const { count, rows: logs } = await ActivityLog.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
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
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

// Get system health
router.get('/system/health', asyncHandler(async (req, res) => {
  // Database connection test
  let dbStatus = 'healthy';
  try {
    await require('../models').sequelize.authenticate();
  } catch (error) {
    dbStatus = 'error';
  }

  // System metrics
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  };

  // Recent errors
  const recentErrors = await ActivityLog.findAll({
    where: { severity: { [Op.in]: ['high', 'critical'] } },
    order: [['createdAt', 'DESC']],
    limit: 10
  });

  res.json({
    success: true,
    data: {
      database: dbStatus,
      systemInfo,
      recentErrors
    }
  });
}));

// Get export data
router.get('/export/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = 'json' } = req.query;

  let data;
  let filename;

  switch (type) {
    case 'orders':
      data = await Order.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      filename = 'orders';
      break;

    case 'products':
      data = await Product.findAll({
        where: { isActive: true },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      filename = 'products';
      break;

    case 'users':
      data = await User.findAll({
        attributes: { exclude: ['password', 'emailVerificationToken', 'resetPasswordToken'] },
        order: [['createdAt', 'DESC']]
      });
      filename = 'users';
      break;

    case 'reviews':
      data = await Review.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          },
          {
            model: Product,
            as: 'product',
            attributes: ['name']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      filename = 'reviews';
      break;

    default:
      throw new AppError('Invalid export type', 400);
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    res.send(csv);
  } else {
    res.json({
      success: true,
      data: { [type]: data }
    });
  }
}));

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0].toJSON());
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Get dashboard widgets data
router.get('/widgets', asyncHandler(async (req, res) => {
  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = await Order.count({
    where: { createdAt: { [Op.gte]: today } }
  });

  const todayRevenue = await Order.sum('total', {
    where: { 
      createdAt: { [Op.gte]: today },
      paymentStatus: 'paid'
    }
  });

  const todayUsers = await User.count({
    where: { createdAt: { [Op.gte]: today } }
  });

  // This month's stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const monthOrders = await Order.count({
    where: { createdAt: { [Op.gte]: thisMonth } }
  });

  const monthRevenue = await Order.sum('total', {
    where: { 
      createdAt: { [Op.gte]: thisMonth },
      paymentStatus: 'paid'
    }
  });

  // Pending actions
  const pendingReviews = await Review.count({ where: { status: 'pending' } });
  const lowStockCount = await Product.count({
    where: {
      isActive: true,
      stockQuantity: { [Op.lte]: require('sequelize').col('lowStockThreshold') }
    }
  });

  res.json({
    success: true,
    data: {
      today: {
        orders: todayOrders,
        revenue: parseFloat(todayRevenue || 0),
        users: todayUsers
      },
      thisMonth: {
        orders: monthOrders,
        revenue: parseFloat(monthRevenue || 0)
      },
      pending: {
        reviews: pendingReviews,
        lowStock: lowStockCount
      }
    }
  });
}));

module.exports = router; 
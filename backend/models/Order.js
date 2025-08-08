const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
        'failed'
      ),
      defaultValue: 'pending'
    },
    // Payment information
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('stripe', 'paypal', 'cash_on_delivery'),
      allowNull: false
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripeChargeId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Pricing
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    shippingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Shipping information
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    shippingMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    trackingUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Timestamps for status changes
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Notes and metadata
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelReason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Customer information
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Currency
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    // Exchange rate for international orders
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 6),
      defaultValue: 1.0
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['orderNumber']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentStatus']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['stripePaymentIntentId']
      }
    ]
  });

  // Instance methods
  Order.prototype.canBeCancelled = function() {
    return ['pending', 'confirmed', 'processing'].includes(this.status);
  };

  Order.prototype.canBeShipped = function() {
    return ['confirmed', 'processing'].includes(this.status);
  };

  Order.prototype.canBeDelivered = function() {
    return this.status === 'shipped';
  };

  Order.prototype.getStatusColor = function() {
    const statusColors = {
      pending: 'yellow',
      confirmed: 'blue',
      processing: 'purple',
      shipped: 'orange',
      delivered: 'green',
      cancelled: 'red',
      refunded: 'gray',
      failed: 'red'
    };
    return statusColors[this.status] || 'gray';
  };

  // Associations
  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'items'
    });
    
    Order.hasMany(models.OrderStatusHistory, {
      foreignKey: 'orderId',
      as: 'statusHistory'
    });
  };

  return Order;
}; 
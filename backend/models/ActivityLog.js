const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entityType: {
      type: DataTypes.ENUM(
        'user',
        'product',
        'order',
        'category',
        'review',
        'inventory',
        'cart',
        'payment',
        'system'
      ),
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Data changes
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    // IP and location
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    // Session information
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Request information
    requestMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    requestUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requestBody: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Error information
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    errorStack: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Performance metrics
    executionTime: {
      type: DataTypes.INTEGER, // milliseconds
      allowNull: true
    },
    // Severity level
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'low'
    },
    // Tags for filtering
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    // Additional metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['action']
      },
      {
        fields: ['entityType']
      },
      {
        fields: ['entityId']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['ipAddress']
      }
    ]
  });

  // Instance methods
  ActivityLog.prototype.getActionDescription = function() {
    const actionDescriptions = {
      'user.login': 'User logged in',
      'user.logout': 'User logged out',
      'user.register': 'User registered',
      'user.update': 'User profile updated',
      'product.create': 'Product created',
      'product.update': 'Product updated',
      'product.delete': 'Product deleted',
      'order.create': 'Order created',
      'order.update': 'Order updated',
      'order.cancel': 'Order cancelled',
      'payment.process': 'Payment processed',
      'payment.fail': 'Payment failed',
      'inventory.adjust': 'Inventory adjusted',
      'review.create': 'Review created',
      'review.update': 'Review updated',
      'review.delete': 'Review deleted'
    };
    return actionDescriptions[this.action] || this.action;
  };

  ActivityLog.prototype.getSeverityColor = function() {
    const colors = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red'
    };
    return colors[this.severity] || 'gray';
  };

  ActivityLog.prototype.hasDataChanges = function() {
    return this.oldValues || this.newValues;
  };

  // Associations
  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return ActivityLog;
}; 
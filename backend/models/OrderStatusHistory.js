const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    fromStatus: {
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
      allowNull: true
    },
    toStatus: {
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
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // System or manual change
    isSystemGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Additional metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'order_status_history',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['toStatus']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Instance methods
  OrderStatusHistory.prototype.getStatusChangeDescription = function() {
    if (!this.fromStatus) {
      return `Order status set to ${this.toStatus}`;
    }
    return `Order status changed from ${this.fromStatus} to ${this.toStatus}`;
  };

  // Associations
  OrderStatusHistory.associate = (models) => {
    OrderStatusHistory.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    
    OrderStatusHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return OrderStatusHistory;
}; 
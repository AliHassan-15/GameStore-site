const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    // Product snapshot at time of purchase
    productSnapshot: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    // Status tracking for individual items
    status: {
      type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'returned', 'refunded'),
      defaultValue: 'pending'
    },
    // Return/refund information
    returnReason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    refundDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['product_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance methods
  OrderItem.prototype.getFinalPrice = function() {
    return this.totalPrice - this.discountAmount + this.taxAmount;
  };

  OrderItem.prototype.canBeReturned = function() {
    return this.status === 'delivered' && !this.returnDate;
  };

  OrderItem.prototype.canBeRefunded = function() {
    return ['delivered', 'returned'].includes(this.status) && !this.refundDate;
  };

  // Associations
  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return OrderItem;
}; 
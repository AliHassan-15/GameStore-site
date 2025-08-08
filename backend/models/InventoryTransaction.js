const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
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
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    transactionType: {
      type: DataTypes.ENUM(
        'purchase',
        'sale',
        'adjustment',
        'return',
        'damage',
        'expiry',
        'transfer_in',
        'transfer_out',
        'initial_stock'
      ),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    previousStock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    newStock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // Reference information
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    referenceType: {
      type: DataTypes.ENUM('purchase_order', 'sales_order', 'return', 'adjustment', 'transfer'),
      allowNull: true
    },
    // Location tracking
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fromLocation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    toLocation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Notes and metadata
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Supplier information for purchases
    supplierName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    supplierInvoice: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Expiry date for perishable items
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // Batch/lot number
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Quality status
    qualityStatus: {
      type: DataTypes.ENUM('good', 'damaged', 'expired', 'defective'),
      defaultValue: 'good'
    },
    // System generated or manual
    isSystemGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // IP address for audit trail
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // User agent for audit trail
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'inventory_transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['product_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['order_id']
      },
      {
        fields: ['transaction_type']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['reference_number']
      },
      {
        fields: ['location']
      }
    ]
  });

  // Instance methods
  InventoryTransaction.prototype.getStockChange = function() {
    return this.newStock - this.previousStock;
  };

  InventoryTransaction.prototype.isPositive = function() {
    return this.quantity > 0;
  };

  InventoryTransaction.prototype.isNegative = function() {
    return this.quantity < 0;
  };

  InventoryTransaction.prototype.getTransactionDescription = function() {
    const descriptions = {
      purchase: 'Stock purchased',
      sale: 'Stock sold',
      adjustment: 'Stock adjusted',
      return: 'Stock returned',
      damage: 'Stock damaged',
      expiry: 'Stock expired',
      transfer_in: 'Stock transferred in',
      transfer_out: 'Stock transferred out',
      initial_stock: 'Initial stock'
    };
    return descriptions[this.transactionType] || 'Stock transaction';
  };

  // Associations
  InventoryTransaction.associate = (models) => {
    InventoryTransaction.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    
    InventoryTransaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    InventoryTransaction.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
  };

  return InventoryTransaction;
}; 
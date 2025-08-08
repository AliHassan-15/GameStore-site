const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    // Price at time of adding to cart (for price change tracking)
    priceAtAdd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Session ID for guest users
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Notes for the item
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Whether the item is selected for checkout
    isSelected: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Expiration date for cart items (auto-cleanup)
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'cart_items',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['productId']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  // Instance methods
  CartItem.prototype.getTotalPrice = function() {
    return this.priceAtAdd * this.quantity;
  };

  CartItem.prototype.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
  };

  // Associations
  CartItem.associate = (models) => {
    CartItem.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    CartItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return CartItem;
}; 
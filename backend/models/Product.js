const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    lowStockThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 0
      }
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    dimensions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    mainImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    subcategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true
    },
    platform: {
      type: DataTypes.ENUM('PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Nintendo Switch', 'Mobile', 'Multi-platform'),
      allowNull: true
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ageRating: {
      type: DataTypes.ENUM('E', 'E10+', 'T', 'M', 'AO'),
      allowNull: true
    },
    releaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    publisher: {
      type: DataTypes.STRING,
      allowNull: true
    },
    developer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isDigital: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPhysical: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metaTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    specifications: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    // SEO and analytics
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    soldCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'products',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        unique: true,
        fields: ['sku']
      },
      {
        fields: ['category_id']
      },
      {
        fields: ['subcategory_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['platform']
      },
      {
        fields: ['brand']
      }
    ]
  });

  // Instance methods
  Product.prototype.isInStock = function() {
    return this.stockQuantity > 0;
  };

  Product.prototype.isLowStock = function() {
    return this.stockQuantity <= this.lowStockThreshold && this.stockQuantity > 0;
  };

  Product.prototype.isOutOfStock = function() {
    return this.stockQuantity === 0;
  };

  Product.prototype.getDiscountPercentage = function() {
    if (!this.compareAtPrice || this.compareAtPrice <= this.price) {
      return 0;
    }
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  };

  // Associations
  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    
    Product.belongsTo(models.Category, {
      foreignKey: 'subcategoryId',
      as: 'subcategory'
    });
    
    Product.hasMany(models.Review, {
      foreignKey: 'productId',
      as: 'reviews'
    });
    
    Product.hasMany(models.CartItem, {
      foreignKey: 'productId',
      as: 'cartItems'
    });
    
    Product.hasMany(models.OrderItem, {
      foreignKey: 'productId',
      as: 'orderItems'
    });
    
    Product.hasMany(models.InventoryTransaction, {
      foreignKey: 'productId',
      as: 'inventoryTransactions'
    });
    
    Product.hasMany(models.ProductImage, {
      foreignKey: 'productId',
      as: 'productImages'
    });
  };

  return Product;
}; 
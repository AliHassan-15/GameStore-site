const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
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
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Review status
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    // Admin response
    adminResponse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    adminResponseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Helpful votes
    helpfulVotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalVotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Review images
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    // Review metadata
    verifiedPurchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Platform/device info
    platform: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['productId']
      },
      {
        fields: ['orderId']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Instance methods
  Review.prototype.getHelpfulPercentage = function() {
    if (this.totalVotes === 0) return 0;
    return Math.round((this.helpfulVotes / this.totalVotes) * 100);
  };

  Review.prototype.isVerifiedPurchase = function() {
    return this.verifiedPurchase;
  };

  Review.prototype.getRatingStars = function() {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
  };

  // Associations
  Review.associate = (models) => {
    Review.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    Review.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    
    Review.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order'
    });
    
    Review.hasMany(models.ReviewVote, {
      foreignKey: 'reviewId',
      as: 'votes'
    });
  };

  return Review;
}; 
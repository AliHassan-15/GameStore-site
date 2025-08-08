const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReviewVote = sequelize.define('ReviewVote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reviewId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'reviews',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    voteType: {
      type: DataTypes.ENUM('helpful', 'unhelpful'),
      allowNull: false
    },
    // IP address for anonymous votes
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // User agent for tracking
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'review_votes',
    timestamps: true,
    indexes: [
      {
        fields: ['review_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['vote_type']
      },
      {
        unique: true,
        fields: ['review_id', 'user_id']
      }
    ]
  });

  // Associations
  ReviewVote.associate = (models) => {
    ReviewVote.belongsTo(models.Review, {
      foreignKey: 'reviewId',
      as: 'review'
    });
    
    ReviewVote.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return ReviewVote;
}; 
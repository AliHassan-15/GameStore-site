const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Allow null for OAuth users
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('buyer', 'admin'),
      defaultValue: 'buyer'
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Optional payment information
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Optional shipping address
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    // Optional billing address
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.emailVerificationToken;
    delete values.resetPasswordToken;
    delete values.resetPasswordExpires;
    return values;
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });
    
    User.hasMany(models.Review, {
      foreignKey: 'userId',
      as: 'reviews'
    });
    
    User.hasMany(models.CartItem, {
      foreignKey: 'userId',
      as: 'cartItems'
    });
    
    User.hasMany(models.ActivityLog, {
      foreignKey: 'userId',
      as: 'activityLogs'
    });
  };

  return User;
}; 
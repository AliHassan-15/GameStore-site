'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true // Allow null for Google OAuth users
      },
      googleId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('buyer', 'admin'),
        defaultValue: 'buyer',
        allowNull: false
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      emailVerificationToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emailVerificationExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resetPasswordToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resetPasswordExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      stripeCustomerId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // Payment details
      paymentMethod: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      // Address details
      billingAddress: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      shippingAddress: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['googleId']);
    await queryInterface.addIndex('Users', ['role']);
    await queryInterface.addIndex('Users', ['isActive']);
    await queryInterface.addIndex('Users', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
}; 
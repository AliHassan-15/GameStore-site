'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        id: uuidv4(),
        email: 'admin@gamestore.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'buyer@gamestore.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer',
        isEmailVerified: true,
        isActive: true,
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        billingAddress: JSON.stringify({
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }),
        shippingAddress: JSON.stringify({
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'jane@gamestore.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'buyer',
        isEmailVerified: true,
        isActive: true,
        phone: '+1987654321',
        dateOfBirth: '1985-05-15',
        billingAddress: JSON.stringify({
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }),
        shippingAddress: JSON.stringify({
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Users', users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.in]: ['admin@gamestore.com', 'buyer@gamestore.com', 'jane@gamestore.com']
      }
    }, {});
  }
}; 
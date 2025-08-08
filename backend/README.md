# GameStore Backend API

A comprehensive e-commerce backend API built with Express.js, PostgreSQL, and Sequelize for a gaming products store.

## Features

- **Authentication & Authorization**: JWT-based authentication with Google OAuth support
- **User Management**: Complete user registration, profile management, and role-based access control
- **Product Management**: CRUD operations for products with categories, images, and inventory tracking
- **Shopping Cart**: Full cart functionality with session management
- **Order Management**: Complete order lifecycle from creation to delivery
- **Payment Processing**: Stripe integration for secure payments
- **Review System**: Product reviews with rating and voting
- **Admin Dashboard**: Comprehensive analytics and management tools
- **File Upload**: Image upload and processing with Sharp
- **Background Jobs**: Automated order processing and email notifications
- **Activity Logging**: Comprehensive system activity tracking
- **Email Service**: Automated email notifications using Nodemailer

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT, Passport.js (Local & Google OAuth)
- **Payment**: Stripe
- **File Processing**: Multer, Sharp
- **Email**: Nodemailer
- **Background Jobs**: Cron
- **Validation**: Express-validator
- **Security**: Helmet, Rate limiting, CORS

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (optional, for session storage)
- SMTP server (for email functionality)

## Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gameStoreSiteDB
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Session Configuration
   SESSION_SECRET=your_session_secret_here

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE "gameStoreSiteDB";
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database with demo data**
   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

## Database Setup

### Manual Database Creation
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE "gameStoreSiteDB";

-- Connect to the database
\c gameStoreSiteDB

-- Exit psql
\q
```

### Using Sequelize CLI
```bash
# Create database
npx sequelize-cli db:create

# Run migrations
npx sequelize-cli db:migrate

# Seed data
npx sequelize-cli db:seed:all

# Reset database (drop, create, migrate, seed)
npx sequelize-cli db:reset
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/orders` - Get user orders
- `GET /api/users/reviews` - Get user reviews
- `GET /api/users/stats` - Get user statistics
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/stats/overview` - Get user statistics overview (admin)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `GET /api/products/:id/analytics` - Get product analytics (admin)
- `GET /api/products/:id/related` - Get related products
- `GET /api/products/brands` - Get distinct brands
- `GET /api/products/platforms` - Get distinct platforms

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/slug/:slug` - Get category by slug
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)
- `POST /api/categories/import` - Import categories from Excel (admin)
- `GET /api/categories/export` - Export categories to Excel (admin)
- `GET /api/categories/tree` - Get category tree structure
- `GET /api/categories/stats` - Get category statistics (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove cart item
- `DELETE /api/cart` - Clear cart
- `PUT /api/cart/select` - Update item selection
- `GET /api/cart/summary` - Get cart summary

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `POST /api/orders/:id/cancel` - Cancel order
- `GET /api/orders` - Get all orders (admin)
- `PUT /api/orders/:id/status` - Update order status (admin)

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/reviews/user` - Get user reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/vote` - Vote on review
- `GET /api/reviews` - Get all reviews (admin)
- `PUT /api/reviews/:id/status` - Update review status (admin)
- `DELETE /api/reviews/:id` - Delete review (admin)

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/payment-methods` - Get payment methods
- `POST /api/payments/payment-methods` - Add payment method
- `DELETE /api/payments/payment-methods/:id` - Remove payment method
- `POST /api/payments/refund` - Process refund
- `POST /api/payments/webhook` - Stripe webhook handler

### Admin
- `GET /api/admin/dashboard` - Get dashboard overview
- `GET /api/admin/analytics/sales` - Get sales analytics
- `GET /api/admin/analytics/inventory` - Get inventory analytics
- `GET /api/admin/analytics/users` - Get user analytics
- `GET /api/admin/activity-logs` - Get activity logs
- `GET /api/admin/system/health` - Get system health
- `GET /api/admin/export/:type` - Export data
- `GET /api/admin/widgets` - Get dashboard widgets

### Upload
- `POST /api/upload/product-images` - Upload product images
- `POST /api/upload/category-image` - Upload category image
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/review-images` - Upload review images
- `DELETE /api/upload/:filename` - Delete uploaded file
- `GET /api/upload/stats` - Get upload statistics
- `POST /api/upload/cleanup` - Clean up orphaned files

## Demo Accounts

After running the seeders, you'll have these demo accounts:

### Admin Account
- **Email**: admin@gamestore.com
- **Password**: password123
- **Role**: Admin

### Buyer Accounts
- **Email**: buyer@gamestore.com
- **Password**: password123
- **Role**: Buyer

- **Email**: jane@gamestore.com
- **Password**: password123
- **Role**: Buyer

## Background Jobs

The application includes several background jobs that run automatically:

- **Order Processing**: Simulates order processing and shipping (every 5 minutes)
- **Review Requests**: Sends review request emails for delivered orders (daily at 10 AM)
- **Session Cleanup**: Cleans up expired sessions (daily at 2 AM)
- **Inventory Alerts**: Checks for low stock products (daily at 9 AM)
- **Analytics**: Aggregates daily statistics (daily at 1 AM)

## File Structure

```
backend/
├── config/
│   ├── database.js          # Database configuration
│   └── passport.js          # Passport authentication config
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── errorHandler.js      # Error handling middleware
│   └── activityLogger.js    # Activity logging middleware
├── models/
│   ├── index.js             # Database models initialization
│   ├── User.js              # User model
│   ├── Product.js           # Product model
│   ├── Category.js          # Category model
│   ├── Order.js             # Order model
│   ├── OrderItem.js         # Order item model
│   ├── CartItem.js          # Cart item model
│   ├── Review.js            # Review model
│   ├── InventoryTransaction.js # Inventory transaction model
│   ├── ActivityLog.js       # Activity log model
│   ├── OrderStatusHistory.js # Order status history model
│   ├── ReviewVote.js        # Review vote model
│   └── ProductImage.js      # Product image model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── products.js          # Product management routes
│   ├── categories.js        # Category management routes
│   ├── cart.js              # Shopping cart routes
│   ├── orders.js            # Order management routes
│   ├── reviews.js           # Review management routes
│   ├── payments.js          # Payment processing routes
│   ├── admin.js             # Admin dashboard routes
│   └── upload.js            # File upload routes
├── utils/
│   ├── emailService.js      # Email service utilities
│   └── backgroundJobs.js    # Background job manager
├── migrations/              # Database migrations
├── seeders/                 # Database seeders
├── uploads/                 # Uploaded files
├── server.js                # Main application file
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | gameStoreSiteDB |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 15m |
| `JWT_REFRESH_EXPIRES_IN` | JWT refresh expiration | 7d |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_PASSWORD` | Redis password | - |
| `SESSION_SECRET` | Session secret | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | - |
| `EMAIL_HOST` | SMTP host | smtp.gmail.com |
| `EMAIL_PORT` | SMTP port | 587 |
| `EMAIL_USER` | SMTP user | - |
| `EMAIL_PASS` | SMTP password | - |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL | http://localhost:5173 |
| `UPLOAD_PATH` | Upload directory | ./uploads |
| `MAX_FILE_SIZE` | Max file size | 5242880 |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with demo data
- `npm run db:reset` - Reset database (drop, create, migrate, seed)

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Input validation with express-validator
- SQL injection prevention with Sequelize
- XSS protection
- CSRF protection

## Error Handling

The application includes comprehensive error handling:

- Custom `AppError` class for operational errors
- Global error handler middleware
- Automatic error logging to database
- Structured error responses
- Async error handling with `asyncHandler`

## Logging

- HTTP request logging with Morgan
- Activity logging for user actions
- Error logging with severity levels
- Database query logging in development
- Background job logging

## Testing

To run tests (when implemented):
```bash
npm test
```

## Deployment

### Production Setup

1. Set `NODE_ENV=production` in environment variables
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up PM2 or similar process manager
6. Configure logging and monitoring

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository. 
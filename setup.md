# GameStore E-commerce Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Redis** (v6 or higher)
4. **Git**

## Environment Setup

### 1. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE gameStoreSiteDB;
CREATE USER gamestore_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gameStoreSiteDB TO gamestore_user;
```

### 2. Redis Setup

Install and start Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows
# Download from https://redis.io/download
```

### 3. Environment Variables

Create `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gameStoreSiteDB
DB_USER=postgres
DB_PASSWORD=qbatch

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_for_gamestore_2024
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_for_gamestore_2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=qbatch

# Session Configuration
SESSION_SECRET=your_super_secret_session_key_for_gamestore_2024

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

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

## Installation

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Navigate to backend directory
cd backend

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### 3. Start Development Servers

```bash
# From root directory
npm run dev
```

This will start both backend (port 5000) and frontend (port 5173) servers.

## Available Scripts

### Root Directory
- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only backend server
- `npm run dev:frontend` - Start only frontend server
- `npm run install:all` - Install all dependencies
- `npm run build` - Build frontend for production
- `npm run db:setup` - Setup database with migrations and seeds
- `npm run db:reset` - Reset database (drop, create, migrate, seed)

### Backend Directory
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database completely

### Frontend Directory
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Order Endpoints
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status (admin only)

### Cart Endpoints
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove cart item

## Features

### User Features
- User registration and authentication
- Google OAuth integration
- Shopping cart management
- Order placement and tracking
- Product reviews and ratings
- User profile management

### Admin Features
- Product management (CRUD)
- Order management
- User management
- Category management
- Analytics dashboard
- Inventory tracking

### Technical Features
- JWT authentication with refresh tokens
- Redis session storage
- File upload with image processing
- Stripe payment integration
- Activity logging
- Error handling and validation
- Responsive design with Tailwind CSS
- TypeScript support

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Redis Connection Error**
   - Ensure Redis is running
   - Check Redis configuration in `.env`

3. **Port Already in Use**
   - Change ports in `.env` file
   - Kill processes using the ports

4. **CORS Errors**
   - Ensure frontend URL is correct in backend `.env`
   - Check CORS configuration in `server.js`

## Development Notes

- Backend uses Express.js with Sequelize ORM
- Frontend uses React with TypeScript and Vite
- UI components use Shadcn UI and Tailwind CSS
- State management uses Zustand
- API calls use Axios with interceptors
- Authentication uses JWT with refresh tokens
- File uploads use Multer with Sharp for image processing

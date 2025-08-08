# 🎮 GameStore E-commerce Platform

A complete, professional e-commerce application for gaming products built with modern web technologies.

## 🚀 Features

### User Features
- **Authentication**: Secure login/register with Google OAuth support
- **Product Browsing**: Search, filter, and sort products
- **Shopping Cart**: Add/remove items with real-time updates
- **Order Management**: Place orders and track their status
- **Reviews & Ratings**: Leave reviews for purchased products
- **User Profile**: Manage personal information and addresses

### Admin Features
- **Dashboard**: Analytics and overview of store performance
- **Product Management**: Full CRUD operations for products
- **Order Management**: Process and update order statuses
- **User Management**: View and manage customer accounts
- **Category Management**: Organize products with categories
- **Inventory Tracking**: Monitor stock levels and transactions
- **Activity Logging**: Track all system activities

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **Redis Sessions**: Scalable session management
- **File Upload**: Image processing with Sharp
- **Stripe Integration**: Secure payment processing
- **Real-time Updates**: Live cart and inventory updates
- **Responsive Design**: Mobile-first approach
- **TypeScript**: Full type safety
- **Error Handling**: Comprehensive error management

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Sequelize ORM
- **Redis** for session storage
- **JWT** for authentication
- **Stripe** for payments
- **Multer** for file uploads
- **Sharp** for image processing

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **Framer Motion** for animations
- **Zustand** for state management
- **React Query** for data fetching

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd GameStore-site
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm run install:all
```

### 3. Environment Setup

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

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb gameStoreSiteDB

# Run migrations and seed data
npm run db:setup
```

### 5. Start Development Servers
```bash
# Start both backend and frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
GameStore-site/
├── backend/                 # Express.js backend
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Custom middleware
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── seeders/           # Database seeders
│   └── utils/             # Utility functions
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
└── package.json           # Root package.json
```

## 🚀 Available Scripts

### Root Directory
- `npm run dev` - Start both backend and frontend
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend
- `npm run install:all` - Install all dependencies
- `npm run build` - Build frontend for production
- `npm run db:setup` - Setup database
- `npm run db:reset` - Reset database

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:reset` - Reset database

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Authentication

The application uses JWT-based authentication with refresh tokens:

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Google OAuth**: Social login integration
- **Role-based Access**: Admin and buyer roles

## 💳 Payment Integration

Stripe integration for secure payments:

- **Test Mode**: Use test keys for development
- **Webhook Support**: Real-time payment updates
- **Multiple Payment Methods**: Cards, digital wallets
- **Refund Support**: Full refund processing

## 📊 Admin Dashboard

Comprehensive admin interface with:

- **Analytics**: Sales, user, and inventory analytics
- **Product Management**: Full CRUD operations
- **Order Processing**: Status updates and tracking
- **User Management**: Customer account management
- **Inventory Tracking**: Stock level monitoring
- **Activity Logs**: System activity monitoring

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Theme switching
- **Smooth Animations**: Framer Motion integration
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

## 🔧 Development

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

### Testing
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files
npm run preview
```

## 📝 API Documentation

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the setup guide

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Advanced inventory management
- [ ] AI-powered product recommendations
- [ ] Social media integration
- [ ] Advanced payment methods
- [ ] Real-time chat support

---

**Built with ❤️ using modern web technologies**

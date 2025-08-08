#!/bin/bash

echo "🎮 GameStore E-commerce Platform - Quick Start"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL."
    exit 1
fi

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis is not installed. Please install Redis."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "🔧 Creating environment file..."
    cat > backend/.env << EOL
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
EOL
    echo "✅ Environment file created!"
else
    echo "✅ Environment file already exists!"
fi

# Create uploads directory
mkdir -p backend/uploads

# Setup database
echo "🗄️ Setting up database..."
npm run db:setup

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your actual credentials"
echo "2. Start the development servers: npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "Happy coding! 🚀"

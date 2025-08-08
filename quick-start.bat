@echo off
echo 🎮 GameStore E-commerce Platform - Quick Start
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL.
    pause
    exit /b 1
)

REM Check if Redis is installed
redis-cli --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Redis is not installed. Please install Redis.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed!

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all

REM Create .env file if it doesn't exist
if not exist "backend\.env" (
    echo 🔧 Creating environment file...
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=gameStoreSiteDB
        echo DB_USER=postgres
        echo DB_PASSWORD=qbatch
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your_super_secret_jwt_key_for_gamestore_2024
        echo JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_for_gamestore_2024
        echo JWT_EXPIRES_IN=15m
        echo JWT_REFRESH_EXPIRES_IN=7d
        echo.
        echo # Redis Configuration
        echo REDIS_HOST=localhost
        echo REDIS_PORT=6379
        echo REDIS_PASSWORD=qbatch
        echo.
        echo # Session Configuration
        echo SESSION_SECRET=your_super_secret_session_key_for_gamestore_2024
        echo.
        echo # Google OAuth Configuration
        echo GOOGLE_CLIENT_ID=your_google_client_id_here
        echo GOOGLE_CLIENT_SECRET=your_google_client_secret_here
        echo GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
        echo.
        echo # Stripe Configuration
        echo STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
        echo STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
        echo STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
        echo.
        echo # Email Configuration
        echo EMAIL_HOST=smtp.gmail.com
        echo EMAIL_PORT=587
        echo EMAIL_USER=your_email@gmail.com
        echo EMAIL_PASS=your_email_password
        echo.
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo FRONTEND_URL=http://localhost:5173
        echo.
        echo # File Upload Configuration
        echo UPLOAD_PATH=./uploads
        echo MAX_FILE_SIZE=5242880
    ) > backend\.env
    echo ✅ Environment file created!
) else (
    echo ✅ Environment file already exists!
)

REM Create uploads directory
if not exist "backend\uploads" mkdir backend\uploads

REM Setup database
echo 🗄️ Setting up database...
call npm run db:setup

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Update the .env file with your actual credentials
echo 2. Start the development servers: npm run dev
echo 3. Open http://localhost:5173 in your browser
echo.
echo Happy coding! 🚀
pause

# Development Scripts Guide

## Quick Start Commands

### 🚀 Start Both Backend and Frontend
```bash
npm run dev
```
- Runs backend on port 5000
- Runs frontend on port 5173
- Uses colored output to distinguish between services

### 🔧 Backend Only
```bash
npm run dev:backend
```
- Runs only the backend server with nodemon
- Useful for backend-only development

### 🎨 Frontend Only
```bash
npm run dev:frontend
```
- Runs only the frontend with Vite
- Useful for frontend-only development

### 🔗 Backend + Stripe Webhook
```bash
npm run dev:webhook
```
- Runs backend server
- Starts Stripe CLI webhook forwarding
- Perfect for testing Stripe integrations

## Database Commands

### 🗄️ Setup Database
```bash
npm run db:setup
```
- Runs migrations
- Seeds the database with sample data

### 🔄 Reset Database
```bash
npm run db:reset
```
- Drops and recreates database
- Runs migrations and seeds
- **⚠️ Warning: This will delete all data!**

## Testing Commands

### 🧪 Test Webhook
```bash
npm run test:webhook
```
- Runs the webhook test server on port 5001
- Use with: `stripe listen --forward-to localhost:5001/test-webhook`

## Installation

### 📦 Install All Dependencies
```bash
npm run install:all
```
- Installs root dependencies
- Installs backend dependencies
- Installs frontend dependencies

## Production

### 🏗️ Build Frontend
```bash
npm run build
```
- Builds the frontend for production

### 🚀 Start Production Server
```bash
npm start
```
- Starts the backend server in production mode

## Concurrent Output Colors

- **🔵 Blue**: Backend server
- **🟢 Green**: Frontend development server
- **🔴 Red**: Stripe webhook forwarding

## Example Workflow

1. **First time setup**:
   ```bash
   npm run install:all
   npm run db:setup
   ```

2. **Daily development**:
   ```bash
   npm run dev
   ```

3. **Testing Stripe**:
   ```bash
   npm run dev:webhook
   # In another terminal:
   stripe trigger payment_intent.succeeded
   ```

4. **Reset database**:
   ```bash
   npm run db:reset
   ``` 
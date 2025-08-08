# GameStore Frontend

A modern, responsive e-commerce frontend built with React, TypeScript, Vite, Tailwind CSS, and Shadcn UI for the GameStore application.

## Features

- **Modern Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Beautiful UI**: Shadcn UI components with custom styling
- **Responsive Design**: Mobile-first approach with responsive layouts
- **State Management**: Zustand for global state management
- **Authentication**: JWT-based auth with Google OAuth support
- **Shopping Cart**: Real-time cart management with persistence
- **Payment Integration**: Stripe payment processing
- **Admin Dashboard**: Comprehensive admin interface
- **Dark Mode**: Theme switching with system preference detection
- **Animations**: Framer Motion for smooth animations
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query for server state management

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (Radix UI primitives)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Payment**: Stripe Elements
- **Date Handling**: date-fns

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running (see backend README)

## Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   VITE_APP_NAME=GameStore
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn UI components
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # Layout components
│   │   ├── forms/         # Form components
│   │   └── common/        # Common components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   ├── admin/         # Admin pages
│   │   ├── products/      # Product pages
│   │   ├── orders/        # Order pages
│   │   └── errors/        # Error pages
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features

### Authentication
- User registration and login
- Google OAuth integration
- Password reset functionality
- Email verification
- Protected routes

### Product Management
- Product listing with filters and search
- Product detail pages
- Category browsing
- Related products
- Product reviews and ratings

### Shopping Cart
- Add/remove items
- Quantity management
- Cart persistence
- Guest cart support

### Checkout Process
- Address management
- Payment method selection
- Stripe payment processing
- Order confirmation

### Admin Dashboard
- Product management (CRUD)
- Category management
- Order management
- User management
- Analytics and reports
- Review moderation

### User Features
- Profile management
- Order history
- Review management
- Address book
- Payment methods

## Component Architecture

### UI Components (Shadcn UI)
- Button, Input, Card, Modal
- Toast notifications
- Dropdown menus
- Form components
- Data tables
- Charts and graphs

### Layout Components
- RootLayout - Main application layout
- AdminLayout - Admin dashboard layout
- Header - Navigation and user menu
- Sidebar - Admin navigation
- Footer - Site footer

### Form Components
- LoginForm - User authentication
- RegisterForm - User registration
- ProductForm - Product management
- CheckoutForm - Order checkout
- ReviewForm - Product reviews

## State Management

### Zustand Stores
- `useAuthStore` - Authentication state
- `useCartStore` - Shopping cart state
- `useUIStore` - UI state (theme, toasts, modals)
- `useProductStore` - Product and filter state
- `useAdminStore` - Admin dashboard state

### React Query
- Product data fetching and caching
- User data management
- Order management
- Admin analytics

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom design system
- Responsive breakpoints
- Dark mode support

### Custom Components
- Consistent design language
- Reusable component patterns
- Accessibility features
- Animation support

## API Integration

### REST API Client
- Axios-based HTTP client
- Request/response interceptors
- Error handling
- Authentication headers

### Endpoints
- Authentication endpoints
- Product management
- Order processing
- User management
- Admin operations

## Performance Optimizations

- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Caching strategies
- Lazy loading

## Security Features

- JWT token management
- Secure cookie handling
- Input validation
- XSS protection
- CSRF protection

## Testing

### Unit Testing
- Component testing with React Testing Library
- Hook testing
- Utility function testing

### Integration Testing
- API integration testing
- User flow testing
- Payment flow testing

## Deployment

### Build Process
```bash
npm run build
```

### Environment Variables
- Production API URL
- Stripe keys
- Analytics configuration

### Deployment Platforms
- Vercel
- Netlify
- AWS S3 + CloudFront
- Docker containers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Demo Accounts

### Admin Account
- **Email**: admin@gamestore.com
- **Password**: password123

### Buyer Account
- **Email**: buyer@gamestore.com
- **Password**: password123

## Support

For support and questions, please contact the development team or create an issue in the repository.

## License

This project is licensed under the MIT License. 
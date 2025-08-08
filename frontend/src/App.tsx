import {  } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { CartProvider } from '@/contexts/cart-context';
import { StripeProvider } from '@/contexts/stripe-context';

// Layout Components
import { RootLayout } from '@/components/layouts/root-layout';
import { AdminLayout } from '@/components/layouts/admin-layout';

// Public Pages
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password';
import { ProductListPage } from '@/pages/products/product-list';
import { ProductDetailPage } from '@/pages/products/product-detail';
import { SearchPage } from '@/pages/search';

// Protected Pages (Buyer)
import { ProfilePage } from '@/pages/profile';
import { OrdersPage } from '@/pages/orders';
import { CartPage } from '@/pages/cart';
import { CheckoutPage } from '@/pages/checkout/checkout';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/dashboard';
import { AdminProductsPage } from '@/pages/admin/products';
import { AdminProductFormPage } from '@/pages/admin/product-form';
import { AdminCategoriesPage } from '@/pages/admin/categories';
import { AdminOrdersPage } from '@/pages/admin/orders';
import { AdminUsersPage } from '@/pages/admin/users';
import { AdminReviewsPage } from '@/pages/admin/reviews';

// Error Pages
import { NotFoundPage } from '@/pages/errors/not-found';
import { ForbiddenPage } from '@/pages/errors/forbidden';

// Protected Route Components
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AdminRoute } from '@/components/auth/admin-route';

// Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="gamestore-theme">
        <StripeProvider>
          <AuthProvider>
            <CartProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<RootLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="products" element={<ProductListPage />} />
                      <Route path="products/:slug" element={<ProductDetailPage />} />
                      <Route path="search" element={<SearchPage />} />
                      
                      {/* Auth Routes */}
                      <Route path="login" element={<LoginPage />} />
                      <Route path="register" element={<RegisterPage />} />
                      <Route path="forgot-password" element={<ForgotPasswordPage />} />
                      
                      {/* Protected Routes (Buyer) */}
                      <Route path="profile" element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } />
                      <Route path="orders" element={
                        <ProtectedRoute>
                          <OrdersPage />
                        </ProtectedRoute>
                      } />
                      <Route path="cart" element={
                        <ProtectedRoute>
                          <CartPage />
                        </ProtectedRoute>
                      } />
                      <Route path="checkout" element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Error Routes */}
                      <Route path="403" element={<ForbiddenPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }>
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route path="products/new" element={<AdminProductFormPage />} />
                      <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                      <Route path="categories" element={<AdminCategoriesPage />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="reviews" element={<AdminReviewsPage />} />
                    </Route>
                  </Routes>
                  <Toaster />
                </div>
              </Router>
            </CartProvider>
          </AuthProvider>
        </StripeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 
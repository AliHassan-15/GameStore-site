import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  User, 
  Product, 
  Category, 
  CartItem, 
  CartSummary, 
  Order, 
  Review, 
  ProductFilters,
  LoginForm,
  RegisterForm,
  ProductForm,
  CategoryForm,
  ReviewForm,
  PaymentIntent,
  StripePaymentMethod,
  DashboardStats,
  SalesAnalytics,
  InventoryAnalytics,
  UserAnalytics,
  PaginatedResponse
} from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          }, { withCredentials: true });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Login
  login: async (data: LoginForm): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> = await api.post('/auth/login', data);
    return response.data;
  },

  // Register
  register: async (data: RegisterForm): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>> = await api.post('/auth/register', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/me');
    return response.data;
  },

  // Google OAuth
  googleAuth: (): void => {
    window.location.href = '/api/auth/google';
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/auth/resend-verification');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  // Get user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/users/profile', data);
    return response.data;
  },

  // Get user orders
  getOrders: async (): Promise<ApiResponse<Order[]>> => {
    const response: AxiosResponse<ApiResponse<Order[]>> = await api.get('/users/orders');
    return response.data;
  },

  // Get user reviews
  getReviews: async (): Promise<ApiResponse<Review[]>> => {
    const response: AxiosResponse<ApiResponse<Review[]>> = await api.get('/users/reviews');
    return response.data;
  },

  // Get user stats
  getStats: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/users/stats');
    return response.data;
  },

  // Admin: Get all users
  getAllUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> = await api.get('/users', { params });
    return response.data;
  },

  // Admin: Get user by ID
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(`/users/${id}`);
    return response.data;
  },

  // Admin: Update user
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Admin: Delete user
  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Admin: Get user stats overview
  getStatsOverview: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/users/stats/overview');
    return response.data;
  },
};

// Products API
export const productsAPI = {
  // Get all products
  getProducts: async (filters?: ProductFilters): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Product>>> = await api.get('/products', { params: filters });
    return response.data;
  },

  // Get product by ID
  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.get(`/products/${id}`);
    return response.data;
  },

  // Get product by slug
  getProductBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  // Admin: Create product
  createProduct: async (data: ProductForm): Promise<ApiResponse<Product>> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.post('/products', data);
    return response.data;
  },

  // Admin: Update product
  updateProduct: async (id: string, data: Partial<ProductForm>): Promise<ApiResponse<Product>> => {
    const response: AxiosResponse<ApiResponse<Product>> = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Admin: Delete product
  deleteProduct: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Admin: Get product analytics
  getProductAnalytics: async (id: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/products/${id}/analytics`);
    return response.data;
  },

  // Get related products
  getRelatedProducts: async (id: string): Promise<ApiResponse<Product[]>> => {
    const response: AxiosResponse<ApiResponse<Product[]>> = await api.get(`/products/${id}/related`);
    return response.data;
  },

  // Get distinct brands
  getBrands: async (): Promise<ApiResponse<string[]>> => {
    const response: AxiosResponse<ApiResponse<string[]>> = await api.get('/products/brands');
    return response.data;
  },

  // Get distinct platforms
  getPlatforms: async (): Promise<ApiResponse<string[]>> => {
    const response: AxiosResponse<ApiResponse<string[]>> = await api.get('/products/platforms');
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response: AxiosResponse<ApiResponse<Category[]>> = await api.get('/categories');
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
    const response: AxiosResponse<ApiResponse<Category>> = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    const response: AxiosResponse<ApiResponse<Category>> = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },

  // Admin: Create category
  createCategory: async (data: CategoryForm): Promise<ApiResponse<Category>> => {
    const response: AxiosResponse<ApiResponse<Category>> = await api.post('/categories', data);
    return response.data;
  },

  // Admin: Update category
  updateCategory: async (id: string, data: Partial<CategoryForm>): Promise<ApiResponse<Category>> => {
    const response: AxiosResponse<ApiResponse<Category>> = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  // Admin: Delete category
  deleteCategory: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/categories/${id}`);
    return response.data;
  },

  // Admin: Import categories from Excel
  importCategories: async (file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response: AxiosResponse<ApiResponse> = await api.post('/categories/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Admin: Export categories to Excel
  exportCategories: async (): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await api.get('/categories/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get category tree
  getCategoryTree: async (): Promise<ApiResponse<Category[]>> => {
    const response: AxiosResponse<ApiResponse<Category[]>> = await api.get('/categories/tree');
    return response.data;
  },

  // Admin: Get category stats
  getCategoryStats: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/categories/stats');
    return response.data;
  },
};

// Cart API
export const cartAPI = {
  // Get cart
  getCart: async (): Promise<ApiResponse<CartItem[]>> => {
    const response: AxiosResponse<ApiResponse<CartItem[]>> = await api.get('/cart');
    return response.data;
  },

  // Add item to cart
  addToCart: async (data: { productId: string; quantity: number; notes?: string }): Promise<ApiResponse<CartItem>> => {
    const response: AxiosResponse<ApiResponse<CartItem>> = await api.post('/cart/add', data);
    return response.data;
  },

  // Update cart item
  updateCartItem: async (itemId: string, data: { quantity: number; notes?: string }): Promise<ApiResponse<CartItem>> => {
    const response: AxiosResponse<ApiResponse<CartItem>> = await api.put(`/cart/${itemId}`, data);
    return response.data;
  },

  // Remove cart item
  removeCartItem: async (itemId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/cart/${itemId}`);
    return response.data;
  },

  // Clear cart
  clearCart: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete('/cart');
    return response.data;
  },

  // Update item selection
  updateItemSelection: async (itemId: string, isSelected: boolean): Promise<ApiResponse<CartItem>> => {
    const response: AxiosResponse<ApiResponse<CartItem>> = await api.put('/cart/select', { itemId, isSelected });
    return response.data;
  },

  // Get cart summary
  getCartSummary: async (): Promise<ApiResponse<CartSummary>> => {
    const response: AxiosResponse<ApiResponse<CartSummary>> = await api.get('/cart/summary');
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  // Get user orders
  getUserOrders: async (): Promise<ApiResponse<Order[]>> => {
    const response: AxiosResponse<ApiResponse<Order[]>> = await api.get('/orders');
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<ApiResponse<Order>> => {
    const response: AxiosResponse<ApiResponse<Order>> = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Create order
  createOrder: async (data: { 
    items: string[]; 
    shippingAddress: any; 
    billingAddress: any; 
    notes?: string;
    customerEmail: string;
    customerPhone?: string;
  }): Promise<ApiResponse<Order>> => {
    const response: AxiosResponse<ApiResponse<Order>> = await api.post('/orders', data);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id: string, reason?: string): Promise<ApiResponse<Order>> => {
    const response: AxiosResponse<ApiResponse<Order>> = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Admin: Get all orders
  getAllOrders: async (params?: { page?: number; limit?: number; status?: string; paymentStatus?: string }): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Order>>> = await api.get('/orders', { params });
    return response.data;
  },

  // Admin: Update order status
  updateOrderStatus: async (id: string, status: string, trackingNumber?: string): Promise<ApiResponse<Order>> => {
    const response: AxiosResponse<ApiResponse<Order>> = await api.put(`/orders/${id}/status`, { status, trackingNumber });
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  // Get product reviews
  getProductReviews: async (productId: string, params?: { page?: number; limit?: number; rating?: number }): Promise<ApiResponse<PaginatedResponse<Review>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Review>>> = await api.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },

  // Get user reviews
  getUserReviews: async (): Promise<ApiResponse<Review[]>> => {
    const response: AxiosResponse<ApiResponse<Review[]>> = await api.get('/reviews/user');
    return response.data;
  },

  // Create review
  createReview: async (data: ReviewForm & { productId: string; orderId?: string }): Promise<ApiResponse<Review>> => {
    const response: AxiosResponse<ApiResponse<Review>> = await api.post('/reviews', data);
    return response.data;
  },

  // Update review
  updateReview: async (id: string, data: Partial<ReviewForm>): Promise<ApiResponse<Review>> => {
    const response: AxiosResponse<ApiResponse<Review>> = await api.put(`/reviews/${id}`, data);
    return response.data;
  },

  // Delete review
  deleteReview: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  // Vote on review
  voteReview: async (id: string, voteType: 'helpful' | 'unhelpful'): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/reviews/${id}/vote`, { voteType });
    return response.data;
  },

  // Admin: Get all reviews
  getAllReviews: async (params?: { page?: number; limit?: number; status?: string; rating?: number }): Promise<ApiResponse<PaginatedResponse<Review>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Review>>> = await api.get('/reviews', { params });
    return response.data;
  },

  // Admin: Update review status
  updateReviewStatus: async (id: string, status: string, adminResponse?: string): Promise<ApiResponse<Review>> => {
    const response: AxiosResponse<ApiResponse<Review>> = await api.put(`/reviews/${id}/status`, { status, adminResponse });
    return response.data;
  },

  // Admin: Delete review
  deleteReviewAdmin: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/reviews/${id}`);
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  // Create payment intent
  createPaymentIntent: async (data: { orderId: string; amount: number }): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> => {
    const response: AxiosResponse<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> = await api.post('/payments/create-intent', data);
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (data: { paymentIntentId: string; orderId: string }): Promise<ApiResponse<{ order: Order }>> => {
    const response: AxiosResponse<ApiResponse<{ order: Order }>> = await api.post('/payments/confirm', data);
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async (): Promise<ApiResponse<{ paymentMethods: StripePaymentMethod[] }>> => {
    const response: AxiosResponse<ApiResponse<{ paymentMethods: StripePaymentMethod[] }>> = await api.get('/payments/payment-methods');
    return response.data;
  },

  // Add payment method
  addPaymentMethod: async (paymentMethodId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/payments/payment-methods', { paymentMethodId });
    return response.data;
  },

  // Remove payment method
  removePaymentMethod: async (paymentMethodId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/payments/payment-methods/${paymentMethodId}`);
    return response.data;
  },

  // Process refund
  processRefund: async (data: { orderId: string; amount?: number; reason?: string }): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/payments/refund', data);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Get dashboard overview
  getDashboard: async (): Promise<ApiResponse<{
    overview: DashboardStats;
    recentOrders: Order[];
    recentUsers: User[];
    recentReviews: Review[];
    lowStockProducts: Product[];
  }>> => {
    const response: AxiosResponse<ApiResponse<{
      overview: DashboardStats;
      recentOrders: Order[];
      recentUsers: User[];
      recentReviews: Review[];
      lowStockProducts: Product[];
    }>> = await api.get('/admin/dashboard');
    return response.data;
  },

  // Get sales analytics
  getSalesAnalytics: async (period?: string): Promise<ApiResponse<SalesAnalytics>> => {
    const response: AxiosResponse<ApiResponse<SalesAnalytics>> = await api.get('/admin/analytics/sales', { params: { period } });
    return response.data;
  },

  // Get inventory analytics
  getInventoryAnalytics: async (): Promise<ApiResponse<InventoryAnalytics>> => {
    const response: AxiosResponse<ApiResponse<InventoryAnalytics>> = await api.get('/admin/analytics/inventory');
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (period?: string): Promise<ApiResponse<UserAnalytics>> => {
    const response: AxiosResponse<ApiResponse<UserAnalytics>> = await api.get('/admin/analytics/users', { params: { period } });
    return response.data;
  },

  // Get activity logs
  getActivityLogs: async (params?: { page?: number; limit?: number; severity?: string; action?: string; userId?: string }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<any>>> = await api.get('/admin/activity-logs', { params });
    return response.data;
  },

  // Get system health
  getSystemHealth: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/admin/system/health');
    return response.data;
  },

  // Export data
  exportData: async (type: string, format?: string): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await api.get(`/admin/export/${type}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get dashboard widgets
  getWidgets: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/admin/widgets');
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  // Upload product images
  uploadProductImages: async (files: File[], productId?: string): Promise<ApiResponse<{ images: any[] }>> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (productId) {
      formData.append('productId', productId);
    }
    const response: AxiosResponse<ApiResponse<{ images: any[] }>> = await api.post('/upload/product-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload category image
  uploadCategoryImage: async (file: File, categoryId?: string): Promise<ApiResponse<{ image: any }>> => {
    const formData = new FormData();
    formData.append('image', file);
    if (categoryId) {
      formData.append('categoryId', categoryId);
    }
    const response: AxiosResponse<ApiResponse<{ image: any }>> = await api.post('/upload/category-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response: AxiosResponse<ApiResponse<{ avatar: string }>> = await api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload review images
  uploadReviewImages: async (files: File[], reviewId?: string): Promise<ApiResponse<{ images: any[] }>> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (reviewId) {
      formData.append('reviewId', reviewId);
    }
    const response: AxiosResponse<ApiResponse<{ images: any[] }>> = await api.post('/upload/review-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete uploaded file
  deleteFile: async (filename: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/upload/${filename}`);
    return response.data;
  },

  // Get upload statistics
  getUploadStats: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/upload/stats');
    return response.data;
  },

  // Clean up orphaned files
  cleanupFiles: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/upload/cleanup');
    return response.data;
  },
};

export default api; 
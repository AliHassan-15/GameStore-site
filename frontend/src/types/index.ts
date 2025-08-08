// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  role: 'buyer' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  stripeCustomerId?: string;
  paymentMethod?: PaymentMethod;
  billingAddress?: Address;
  shippingAddress?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  costPrice: number;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images: ProductImage[];
  categoryId: string;
  subcategoryId?: string;
  category?: Category;
  subcategory?: Category;
  brand?: string;
  platform?: string;
  genre?: string;
  ageRating?: string;
  releaseDate?: string;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  isPhysical: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  specifications?: Record<string, any>;
  viewCount: number;
  soldCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  title?: string;
  sortOrder: number;
  isMain: boolean;
  isActive: boolean;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Cart Types
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  sessionId?: string;
  notes?: string;
  isSelected: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
  selectedCount: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  notes?: string;
  customerEmail: string;
  customerPhone?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  tax: number;
  productSnapshot: ProductSnapshot;
  status: OrderItemStatus;
  returnReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSnapshot {
  name: string;
  sku: string;
  price: number;
  image?: string;
  specifications?: Record<string, any>;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type OrderItemStatus = 
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'refunded';

// Review Types
export interface Review {
  id: string;
  userId: string;
  user: User;
  productId: string;
  product: Product;
  orderId?: string;
  order?: Order;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatus;
  adminResponse?: string;
  helpfulVotes: number;
  totalVotes: number;
  images?: string[];
  isVerifiedPurchase: boolean;
  isAnonymous: boolean;
  platform?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  voteType: 'helpful' | 'unhelpful';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Inventory Types
export interface InventoryTransaction {
  id: string;
  productId: string;
  product: Product;
  userId?: string;
  user?: User;
  orderId?: string;
  order?: Order;
  transactionType: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  cost?: number;
  referenceNumber?: string;
  location?: string;
  notes?: string;
  reason?: string;
  supplier?: string;
  expiryDate?: string;
  batchNumber?: string;
  qualityStatus?: string;
  isSystemGenerated: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'return'
  | 'damage'
  | 'expiry'
  | 'transfer'
  | 'initial';

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  sessionId?: string;
  requestMethod?: string;
  requestUrl?: string;
  requestBody?: Record<string, any>;
  responseStatus?: number;
  errorMessage?: string;
  executionTime?: number;
  severity: LogSeverity;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type LogSeverity = 'low' | 'medium' | 'high' | 'critical';

// Payment Types
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    address?: Address;
  };
}

// Admin Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingReviews: number;
}

export interface SalesAnalytics {
  salesData: Array<{
    date: string;
    orderCount: number;
    revenue: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    soldCount: number;
    totalRevenue: number;
  }>;
  orderStatusDistribution: Array<{
    status: OrderStatus;
    count: number;
  }>;
}

export interface InventoryAnalytics {
  overview: {
    totalProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    inventoryValue: number;
  };
  recentTransactions: InventoryTransaction[];
  transactionTypes: Array<{
    transactionType: TransactionType;
    count: number;
  }>;
}

export interface UserAnalytics {
  userRegistrations: Array<{
    date: string;
    count: number;
  }>;
  userRoles: Array<{
    role: string;
    count: number;
  }>;
  topCustomers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  paymentMethod?: PaymentMethod;
}

export interface ProductForm {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  costPrice: number;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  categoryId: string;
  subcategoryId?: string;
  brand?: string;
  platform?: string;
  genre?: string;
  ageRating?: string;
  releaseDate?: string;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  isPhysical: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  specifications?: Record<string, any>;
}

export interface CategoryForm {
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ReviewForm {
  rating: number;
  title?: string;
  comment?: string;
  isAnonymous: boolean;
}

// Filter Types
export interface ProductFilters {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  brand?: string;
  platform?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt' | 'soldCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Search Types
export interface SearchResult {
  products: Product[];
  categories: Category[];
  totalResults: number;
  searchTerm: string;
}

// Toast Types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Modal Types
export interface Modal {
  id: string;
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClose?: () => void;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  isActive?: boolean;
  isAdmin?: boolean;
}

// Theme Types
export interface Theme {
  name: string;
  value: 'light' | 'dark' | 'system';
  icon: React.ComponentType<{ className?: string }>;
} 
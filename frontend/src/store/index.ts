import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, CartItem, CartSummary, Product, Category, Toast, Modal } from '@/types';

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({ 
        user: null, 
        isAuthenticated: false, 
        accessToken: null, 
        refreshToken: null 
      }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Cart Store
interface CartState {
  items: CartItem[];
  summary: CartSummary | null;
  isLoading: boolean;
  setItems: (items: CartItem[]) => void;
  setSummary: (summary: CartSummary | null) => void;
  addItem: (item: CartItem) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  updateItemSelection: (itemId: string, isSelected: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      summary: null,
      isLoading: false,
      setItems: (items) => set({ items }),
      setSummary: (summary) => set({ summary }),
      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.productId === item.productId);
        
        if (existingItem) {
          set({
            items: items.map(i => 
              i.productId === item.productId 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      updateItem: (itemId, updates) => {
        const { items } = get();
        set({
          items: items.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
        });
      },
      removeItem: (itemId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== itemId) });
      },
      clearCart: () => set({ items: [], summary: null }),
      setLoading: (isLoading) => set({ isLoading }),
      updateItemSelection: (itemId, isSelected) => {
        const { items } = get();
        set({
          items: items.map(item => 
            item.id === itemId ? { ...item, isSelected } : item
          )
        });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        summary: state.summary,
      }),
    }
  )
);

// UI Store
interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  toasts: Toast[];
  modals: Modal[];
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addModal: (modal: Omit<Modal, 'id'>) => void;
  removeModal: (id: string) => void;
  updateModal: (id: string, updates: Partial<Modal>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: false,
      toasts: [],
      modals: [],
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      addToast: (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        set({ toasts: [...get().toasts, newToast] });
        
        // Auto remove toast after duration
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration || 5000);
        }
      },
      removeToast: (id) => {
        set({ toasts: get().toasts.filter(toast => toast.id !== id) });
      },
      addModal: (modal) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newModal = { ...modal, id };
        set({ modals: [...get().modals, newModal] });
      },
      removeModal: (id) => {
        set({ modals: get().modals.filter(modal => modal.id !== id) });
      },
      updateModal: (id, updates) => {
        set({
          modals: get().modals.map(modal => 
            modal.id === id ? { ...modal, ...updates } : modal
          )
        });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

// Product Store
interface ProductState {
  products: Product[];
  categories: Category[];
  filters: {
    search: string;
    categoryId: string;
    subcategoryId: string;
    brand: string;
    platform: string;
    genre: string;
    minPrice: number;
    maxPrice: number;
    inStock: boolean;
    isFeatured: boolean;
    sortBy: 'name' | 'price' | 'rating' | 'createdAt' | 'soldCount';
    sortOrder: 'asc' | 'desc';
    page: number;
    limit: number;
  };
  isLoading: boolean;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setFilters: (filters: Partial<ProductState['filters']>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
}

export const useProductStore = create<ProductState>()((set) => ({
  products: [],
  categories: [],
  filters: {
    search: '',
    categoryId: '',
    subcategoryId: '',
    brand: '',
    platform: '',
    genre: '',
    minPrice: 0,
    maxPrice: 0,
    inStock: false,
    isFeatured: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 12,
  },
  isLoading: false,
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters, page: 1 } 
  })),
  resetFilters: () => set({
    filters: {
      search: '',
      categoryId: '',
      subcategoryId: '',
      brand: '',
      platform: '',
      genre: '',
      minPrice: 0,
      maxPrice: 0,
      inStock: false,
      isFeatured: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 12,
    }
  }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Admin Store
interface AdminState {
  dashboardStats: any;
  salesAnalytics: any;
  inventoryAnalytics: any;
  userAnalytics: any;
  isLoading: boolean;
  setDashboardStats: (stats: any) => void;
  setSalesAnalytics: (analytics: any) => void;
  setInventoryAnalytics: (analytics: any) => void;
  setUserAnalytics: (analytics: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useAdminStore = create<AdminState>()((set) => ({
  dashboardStats: null,
  salesAnalytics: null,
  inventoryAnalytics: null,
  userAnalytics: null,
  isLoading: false,
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setSalesAnalytics: (salesAnalytics) => set({ salesAnalytics }),
  setInventoryAnalytics: (inventoryAnalytics) => set({ inventoryAnalytics }),
  setUserAnalytics: (userAnalytics) => set({ userAnalytics }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Utility functions
export const toast = {
  success: (title: string, description?: string) => {
    useUIStore.getState().addToast({
      title,
      description,
      type: 'success',
    });
  },
  error: (title: string, description?: string) => {
    useUIStore.getState().addToast({
      title,
      description,
      type: 'error',
    });
  },
  warning: (title: string, description?: string) => {
    useUIStore.getState().addToast({
      title,
      description,
      type: 'warning',
    });
  },
  info: (title: string, description?: string) => {
    useUIStore.getState().addToast({
      title,
      description,
      type: 'info',
    });
  },
};

export const modal = {
  open: (title: string, content: React.ReactNode, size: Modal['size'] = 'md', onClose?: () => void) => {
    useUIStore.getState().addModal({
      title,
      content,
      size,
      isOpen: true,
      onClose,
    });
  },
  close: (id: string) => {
    useUIStore.getState().removeModal(id);
  },
  update: (id: string, updates: Partial<Modal>) => {
    useUIStore.getState().updateModal(id, updates);
  },
}; 
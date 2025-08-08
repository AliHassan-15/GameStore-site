import React, { createContext, useContext, useEffect } from 'react';
import { cartAPI } from '@/lib/api';
import { CartItem, CartSummary } from '@/types';
import { useCartStore } from '@/store';
import { toast } from '@/store';

interface CartContextType {
  items: CartItem[];
  summary: CartSummary | null;
  isLoading: boolean;
  addToCart: (productId: string, quantity: number, notes?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number, notes?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updateItemSelection: (itemId: string, isSelected: boolean) => Promise<void>;
  loadCart: () => Promise<void>;
  loadCartSummary: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { 
    items, 
    summary, 
    isLoading, 
    setItems, 
    setSummary, 
    setLoading,
    addItem: addItemToStore,
    updateItem: updateItemInStore,
    removeItem: removeItemFromStore,
    clearCart: clearCartStore,
    updateItemSelection: updateItemSelectionInStore
  } = useCartStore();

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      
      if (response.success && response.data) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartSummary = async () => {
    try {
      const response = await cartAPI.getCartSummary();
      
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to load cart summary:', error);
    }
  };

  const addToCart = async (productId: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      const response = await cartAPI.addToCart({ productId, quantity, notes });
      
      if (response.success && response.data) {
        // Update local store
        addItemToStore(response.data);
        // Reload cart to get updated data
        await loadCart();
        await loadCartSummary();
        toast.success('Item added to cart!');
      } else {
        throw new Error(response.message || 'Failed to add item to cart');
      }
    } catch (error: any) {
      toast.error('Failed to add item to cart', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number, notes?: string) => {
    try {
      setLoading(true);
      const response = await cartAPI.updateCartItem(itemId, { quantity, notes });
      
      if (response.success && response.data) {
        // Update local store
        updateItemInStore(itemId, { quantity, notes });
        // Reload cart to get updated data
        await loadCart();
        await loadCartSummary();
        toast.success('Cart updated!');
      } else {
        throw new Error(response.message || 'Failed to update cart item');
      }
    } catch (error: any) {
      toast.error('Failed to update cart item', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true);
      const response = await cartAPI.removeCartItem(itemId);
      
      if (response.success) {
        // Update local store
        removeItemFromStore(itemId);
        // Reload cart to get updated data
        await loadCart();
        await loadCartSummary();
        toast.success('Item removed from cart!');
      } else {
        throw new Error(response.message || 'Failed to remove item from cart');
      }
    } catch (error: any) {
      toast.error('Failed to remove item from cart', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.clearCart();
      
      if (response.success) {
        // Update local store
        clearCartStore();
        toast.success('Cart cleared!');
      } else {
        throw new Error(response.message || 'Failed to clear cart');
      }
    } catch (error: any) {
      toast.error('Failed to clear cart', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateItemSelection = async (itemId: string, isSelected: boolean) => {
    try {
      const response = await cartAPI.updateItemSelection(itemId, isSelected);
      
      if (response.success && response.data) {
        // Update local store
        updateItemSelectionInStore(itemId, isSelected);
        // Reload cart summary to get updated totals
        await loadCartSummary();
      } else {
        throw new Error(response.message || 'Failed to update item selection');
      }
    } catch (error: any) {
      toast.error('Failed to update item selection', error.message);
      throw error;
    }
  };

  const value: CartContextType = {
    items,
    summary,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    updateItemSelection,
    loadCart,
    loadCartSummary,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 
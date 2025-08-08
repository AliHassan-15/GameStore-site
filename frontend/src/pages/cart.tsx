import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { formatPrice } from '@/lib/utils';

export const CartPage: React.FC = () => {
  const { items, summary, isLoading, updateCartItem, removeFromCart, updateItemSelection } = useCart();

  useEffect(() => {
    // Load cart data when component mounts
  }, []);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      await updateCartItem(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleSelectionChange = async (itemId: string, isSelected: boolean) => {
    await updateItemSelection(itemId, isSelected);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link to="/products">
            <Button size="lg">
              Start Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">
          Review your items and proceed to checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={item.isSelected}
                    onChange={(e) => handleSelectionChange(item.id, e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  
                  <div className="flex-1 flex items-center space-x-4">
                    <img
                      src={item.product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        SKU: {item.product.sku}
                      </p>
                      <p className="font-semibold text-lg">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                      min="1"
                    />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stockQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({summary.itemCount} items)</span>
                      <span>{formatPrice(summary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(summary.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(summary.shipping)}</span>
                    </div>
                    {summary.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(summary.discount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{formatPrice(summary.total)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link to="/checkout">
                    <Button className="w-full" size="lg">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </>
              )}
              
              <div className="text-center">
                <Link to="/products" className="text-primary hover:underline text-sm">
                  Continue Shopping
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 
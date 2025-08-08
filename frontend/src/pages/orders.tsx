import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ordersAPI } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await ordersAPI.getUserOrders();
      
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          Track your orders and view order history
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link to="/products">
              <Button>
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <img
                          src={item.product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} • {formatPrice(item.unitPrice)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total: {formatPrice(order.total)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        {order.status === 'pending' && (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Shipping Address:</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  )}

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Tracking Number:</h4>
                      <p className="font-mono text-sm">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 
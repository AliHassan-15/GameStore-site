import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
//   TrendingDown,
  Eye,
  Star,
  AlertTriangle
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { DashboardStats, Product } from '@/types';
import { formatPrice } from '@/lib/utils';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const dashboardResponse = await adminAPI.getDashboard();

      if (dashboardResponse.success && dashboardResponse.data) {
        setStats(dashboardResponse.data.overview);
        setRecentOrders(dashboardResponse.data.recentOrders);
        setLowStockProducts(dashboardResponse.data.lowStockProducts);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatPrice(stats.totalRevenue) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12% from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8% from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {lowStockProducts.length} products low in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingReviews || 0} reviews pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Sales chart will be implemented here</p>
                <p className="text-sm text-muted-foreground">
                  Last 30 days: 30 data points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-red-600">{index + 1}</span>
                  </div>
                  <img
                    src={product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {product.stockQuantity} in stock
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatPrice(product.price)}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      {product.averageRating.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All products are well stocked!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.user?.firstName} {order.user?.lastName} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatPrice(order.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent orders</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm text-yellow-800">
                      Low Stock Alert
                    </p>
                    <p className="text-xs text-yellow-700">
                      {lowStockProducts.length} products are running low on stock
                    </p>
                  </div>
                </div>
              )}

              {recentOrders.filter(order => order.status === 'pending').length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-blue-800">
                      Pending Orders
                    </p>
                    <p className="text-xs text-blue-700">
                      {recentOrders.filter(order => order.status === 'pending').length} orders awaiting processing
                    </p>
                  </div>
                </div>
              )}

              {(!lowStockProducts || lowStockProducts.length === 0) &&
               (!recentOrders || recentOrders.filter(order => order.status === 'pending').length === 0) && (
                <div className="text-center py-8">
                  <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No alerts at the moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <Package className="w-6 h-6 text-primary mb-2" />
              <h4 className="font-medium">Add Product</h4>
              <p className="text-sm text-muted-foreground">Create a new product listing</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <ShoppingCart className="w-6 h-6 text-primary mb-2" />
              <h4 className="font-medium">View Orders</h4>
              <p className="text-sm text-muted-foreground">Manage customer orders</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <Users className="w-6 h-6 text-primary mb-2" />
              <h4 className="font-medium">Manage Users</h4>
              <p className="text-sm text-muted-foreground">View and manage customers</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <TrendingUp className="w-6 h-6 text-primary mb-2" />
              <h4 className="font-medium">Analytics</h4>
              <p className="text-sm text-muted-foreground">View detailed analytics</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
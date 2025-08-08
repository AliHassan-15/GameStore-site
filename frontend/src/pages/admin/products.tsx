import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  AlertTriangle
} from 'lucide-react';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getProducts({
        search: searchQuery,
        categoryId: selectedCategory,
        limit: 50
      });
      
      if (response.success && response.data) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await productsAPI.deleteProduct(productId);
        if (response.success) {
          loadProducts(); // Reload the list
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const getStockStatus = (stockQuantity: number, lowStockThreshold: number) => {
    if (stockQuantity === 0) return { status: 'out-of-stock', color: 'text-red-600', bg: 'bg-red-100' };
    if (stockQuantity <= lowStockThreshold) return { status: 'low-stock', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'in-stock', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadProducts}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stockQuantity, product.lowStockThreshold);
          
          return (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  {product.isFeatured && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Featured
                    </span>
                  )}
                  {!product.isActive && (
                    <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      SKU: {product.sku}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-lg">
                        {formatPrice(product.price)}
                      </p>
                      {product.salePrice && product.salePrice < product.price && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.salePrice)}
                        </p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                      {stockStatus.status === 'out-of-stock' ? 'Out of Stock' :
                       stockStatus.status === 'low-stock' ? 'Low Stock' : 'In Stock'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Stock: {product.stockQuantity}</span>
                    <span>Sold: {product.soldCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Views: {product.viewCount}</span>
                    <span>Rating: {product.averageRating.toFixed(1)} ⭐</span>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Link to={`/admin/products/${product.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link to={`/products/${product.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first product.'}
            </p>
            <Link to="/admin/products/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Low Stock</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Out of Stock</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.stockQuantity === 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Products</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 
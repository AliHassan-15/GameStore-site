import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Star, ShoppingCart } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice, getRatingStars } from '@/lib/utils';

export const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getProducts({
        search: searchQuery,
        ...filters,
        limit: 20
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Discover our collection of gaming products
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="createdAt">Latest</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
            }))}
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {product.salePrice && product.salePrice < product.price && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    SALE
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {getRatingStars(product.averageRating).map((star, index) => (
                      <span key={index}>{star}</span>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({product.reviewCount})
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {product.salePrice && product.salePrice < product.price ? (
                      <>
                        <span className="font-bold text-lg">
                          {formatPrice(product.salePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-lg">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link to={`/products/${product.slug}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button size="icon" className="flex-shrink-0">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 
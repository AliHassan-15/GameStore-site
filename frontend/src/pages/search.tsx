import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mainImage: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [priceRange, setPriceRange] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const query = searchParams.get('q') || '';

  // Fetch search results
  const { data: searchData, isLoading } = useQuery({
    queryKey: ['search', query, sortBy, sortOrder, priceRange, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: query,
        sortBy,
        sortOrder,
        ...(priceRange !== 'all' && { priceRange }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
      });
      
      const response = await api.get(`/products?${params}`);
      return response.data.data;
    },
    enabled: !!query,
  });

  const products = searchData?.products || [];
  const totalProducts = searchData?.total || 0;
  const categories = searchData?.categories || [];

  const handleSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const clearFilters = () => {
    setSortBy('relevance');
    setSortOrder('desc');
    setPriceRange('all');
    setCategoryFilter('all');
  };

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h1>
          <p className="text-gray-600 mb-8">
            Enter a search term to find products in our store.
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Search for products..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e.currentTarget.value);
                }
              }}
              className="flex-1"
            />
            <Button onClick={() => {
              const input = document.querySelector('input[placeholder="Search for products..."]') as HTMLInputElement;
              if (input) handleSearch(input.value);
            }}>
              Search
            </Button>
          </div>

          {/* Popular searches */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {['action games', 'rpg', 'strategy', 'sports', 'adventure'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  onClick={() => handleSearch(term)}
                  className="text-sm"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-600">
          {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search for products..."
            defaultValue={query}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e.currentTarget.value);
              }
            }}
            className="max-w-md"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-25">$0 - $25</SelectItem>
              <SelectItem value="25-50">$25 - $50</SelectItem>
              <SelectItem value="50-100">$50 - $100</SelectItem>
              <SelectItem value="100+">$100+</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="createdAt">Newest</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>

          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={clearFilters}>Clear Filters</Button>
            <Button variant="outline" asChild>
              <Link to="/products">Browse All Products</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <Link to={`/products/${product.slug}`}>
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                <Link to={`/products/${product.slug}`}>
                  <CardTitle className="text-lg mb-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </CardTitle>
                </Link>
                
                <div className="mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.category.name}
                  </Badge>
                </div>
                
                <CardDescription className="mb-3 line-clamp-2">
                  {product.description}
                </CardDescription>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.averageRating > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-600">
                        {product.averageRating.toFixed(1)} ({product.reviewCount})
                      </span>
                    </div>
                  )}
                </div>

                <Button className="w-full" asChild>
                  <Link to={`/products/${product.slug}`}>
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  Star, 
  ShoppingCart, 
  Gamepad2, 
  Monitor, 
  Headphones,
  Zap
} from 'lucide-react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { Product, Category } from '@/types';
import { formatPrice, getRatingStars } from '@/lib/utils';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        
        // Load featured products
        const productsResponse = await productsAPI.getProducts({
          isFeatured: true,
          limit: 8
        });
        
        if (productsResponse.success && productsResponse.data) {
          setFeaturedProducts(productsResponse.data.data);
        }

        // Load categories
        const categoriesResponse = await categoriesAPI.getCategories();
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data.slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Your Ultimate
                <span className="block text-yellow-300">Gaming Destination</span>
              </h1>
              <p className="text-xl text-primary-foreground/90">
                Discover the latest games, consoles, and accessories. 
                Level up your gaming experience with premium products.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/categories">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                    Browse Categories
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <Gamepad2 className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Consoles</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <Monitor className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">PC Gaming</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <Headphones className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Accessories</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <Zap className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Latest Games</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground text-lg">
            Find exactly what you're looking for in our organized categories
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={`/categories/${category.slug}`}>
                <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Gamepad2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.productCount || 0} products
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground text-lg">
            Handpicked products for the ultimate gaming experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link to="/products">
            <Button size="lg">
              View All Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose GameStore?</h2>
            <p className="text-muted-foreground text-lg">
              We provide the best gaming experience with quality products and excellent service
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Get your gaming gear delivered quickly and securely to your doorstep
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-muted-foreground">
                Curated selection of premium gaming products from top brands
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">
                Our customer support team is always ready to help you
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}; 
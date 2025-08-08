import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react';
import { productsAPI, reviewsAPI } from '@/lib/api';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { Product, Review } from '@/types';
import { formatPrice, getRatingStars, formatDate } from '@/lib/utils';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [productResponse, reviewsResponse] = await Promise.all([
        productsAPI.getProductBySlug(slug!),
        reviewsAPI.getProductReviews(slug!)
      ]);

      if (productResponse.success && productResponse.data) {
        setProduct(productResponse.data);
      } else {
        setError('Product not found');
      }

      if (reviewsResponse.success && reviewsResponse.data) {
        setReviews(reviewsResponse.data.data || reviewsResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }

    if (!product) return;

    try {
      await addToCart(product.id, quantity);
    } catch (err: any) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <button onClick={() => navigate('/')} className="hover:text-foreground">
              Home
            </button>
          </li>
          <li>/</li>
          <li>
            <button onClick={() => navigate('/products')} className="hover:text-foreground">
              Products
            </button>
          </li>
          <li>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg border">
            <img
              src={product.images[selectedImageIndex]?.imageUrl || '/placeholder-product.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                    selectedImageIndex === index ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image.imageUrl}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground mb-4">{product.description}</p>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {getRatingStars(product.averageRating).map((star, index) => (
                    <span key={index}>{star}</span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                SKU: {product.sku}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            {product.salePrice && product.salePrice < product.price ? (
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                  {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="space-y-2">
            <p className={`text-sm font-medium ${
              product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.stockQuantity > 0 
                ? `${product.stockQuantity} in stock` 
                : 'Out of stock'
              }
            </p>
            {product.stockQuantity <= 10 && product.stockQuantity > 0 && (
              <p className="text-sm text-orange-600">
                Only {product.stockQuantity} left!
              </p>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                  min="1"
                  max={product.stockQuantity}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stockQuantity}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <Truck className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold text-sm">Free Shipping</h4>
              <p className="text-xs text-muted-foreground">On orders over $50</p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold text-sm">Secure Payment</h4>
              <p className="text-xs text-muted-foreground">100% secure checkout</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold text-sm">Easy Returns</h4>
              <p className="text-xs text-muted-foreground">30 day return policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16">
        <div className="border-b">
          <nav className="flex space-x-8">
            <button className="border-b-2 border-primary pb-2 font-medium">
              Description
            </button>
            <button className="text-muted-foreground hover:text-foreground pb-2">
              Specifications
            </button>
            <button className="text-muted-foreground hover:text-foreground pb-2">
              Reviews ({reviews.length})
            </button>
          </nav>
        </div>

        <div className="py-8">
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-4">Product Description</h3>
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-8">Customer Reviews</h3>
          <div className="space-y-6">
            {reviews.slice(0, 5).map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{review.user.firstName} {review.user.lastName}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex text-yellow-400">
                          {getRatingStars(review.rating).map((star, index) => (
                            <span key={index}>{star}</span>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 
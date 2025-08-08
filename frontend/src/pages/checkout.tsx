import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  MapPin, 
  Truck, 
  CheckCircle, 
  ArrowLeft,
  Lock,
  Shield
} from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { ordersAPI, paymentsAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const checkoutSchema = z.object({
  // Shipping Address
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  
  // Payment
  cardNumber: z.string().min(13, 'Valid card number is required'),
  cardExpiry: z.string().min(5, 'Expiry date is required'),
  cardCvc: z.string().min(3, 'CVC is required'),
  cardName: z.string().min(2, 'Cardholder name is required'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, summary, clearCart } = useCart();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill form with user data if available
    if (user) {
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
      
      if (user.shippingAddress) {
        setValue('address', user.shippingAddress.street || '');
        setValue('city', user.shippingAddress.city || '');
        setValue('state', user.shippingAddress.state || '');
        setValue('zipCode', user.shippingAddress.zipCode || '');
        setValue('country', user.shippingAddress.country || '');
      }
    }
  }, [user, items, navigate, setValue]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create order
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          street: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        paymentMethod: {
          cardNumber: data.cardNumber,
          cardExpiry: data.cardExpiry,
          cardCvc: data.cardCvc,
          cardName: data.cardName,
        },
        total: summary?.total || 0,
      };

      const orderResponse = await ordersAPI.createOrder(orderData);
      
      if (orderResponse.success && orderResponse.data) {
        // Process payment
        const paymentResponse = await paymentsAPI.createPaymentIntent({
          orderId: orderResponse.data.id,
          amount: summary?.total || 0,
        });

        if (paymentResponse.success) {
          // Clear cart and redirect to success
          await clearCart();
          navigate('/checkout/success', { 
            state: { orderId: orderResponse.data.id }
          });
        } else {
          setError('Payment processing failed. Please try again.');
        }
      } else {
        setError('Failed to create order. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Shipping Address', icon: MapPin },
    { id: 2, title: 'Payment Method', icon: CreditCard },
    { id: 3, title: 'Order Review', icon: CheckCircle },
  ];

  if (items.length === 0) {
    return null; // Will redirect to cart
  }

  return (
    <div className="min-h-screen bg-muted/50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-primary bg-primary text-primary-foreground' :
                    isCompleted ? 'border-primary bg-primary text-primary-foreground' :
                    'border-muted-foreground text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-6">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Shipping Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Shipping Address
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name *</label>
                        <Input
                          placeholder="Enter first name"
                          {...register('firstName')}
                        />
                        {errors.firstName && (
                          <p className="text-destructive text-sm">{errors.firstName.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name *</label>
                        <Input
                          placeholder="Enter last name"
                          {...register('lastName')}
                        />
                        {errors.lastName && (
                          <p className="text-destructive text-sm">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                          type="email"
                          placeholder="Enter email"
                          {...register('email')}
                        />
                        {errors.email && (
                          <p className="text-destructive text-sm">{errors.email.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone *</label>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          {...register('phone')}
                        />
                        {errors.phone && (
                          <p className="text-destructive text-sm">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Address *</label>
                      <Input
                        placeholder="Enter street address"
                        {...register('address')}
                      />
                      {errors.address && (
                        <p className="text-destructive text-sm">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">City *</label>
                        <Input
                          placeholder="Enter city"
                          {...register('city')}
                        />
                        {errors.city && (
                          <p className="text-destructive text-sm">{errors.city.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">State *</label>
                        <Input
                          placeholder="Enter state"
                          {...register('state')}
                        />
                        {errors.state && (
                          <p className="text-destructive text-sm">{errors.state.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ZIP Code *</label>
                        <Input
                          placeholder="Enter ZIP code"
                          {...register('zipCode')}
                        />
                        {errors.zipCode && (
                          <p className="text-destructive text-sm">{errors.zipCode.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country *</label>
                      <Input
                        placeholder="Enter country"
                        {...register('country')}
                      />
                      {errors.country && (
                        <p className="text-destructive text-sm">{errors.country.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payment Method
                    </h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Card Number *</label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        {...register('cardNumber')}
                      />
                      {errors.cardNumber && (
                        <p className="text-destructive text-sm">{errors.cardNumber.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cardholder Name *</label>
                        <Input
                          placeholder="Enter cardholder name"
                          {...register('cardName')}
                        />
                        {errors.cardName && (
                          <p className="text-destructive text-sm">{errors.cardName.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Expiry Date *</label>
                        <Input
                          placeholder="MM/YY"
                          {...register('cardExpiry')}
                        />
                        {errors.cardExpiry && (
                          <p className="text-destructive text-sm">{errors.cardExpiry.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">CVC *</label>
                        <Input
                          placeholder="123"
                          {...register('cardCvc')}
                        />
                        {errors.cardCvc && (
                          <p className="text-destructive text-sm">{errors.cardCvc.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Place Order'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                {summary && (
                  <div className="border-t pt-4 space-y-2">
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
                )}

                {/* Security Notice */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Secure Checkout</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 
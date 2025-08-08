import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, Mail, Home, ShoppingBag } from 'lucide-react';

export const CheckoutSuccessPage: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <div className="min-h-screen bg-muted/50 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">
                Order Confirmed!
              </CardTitle>
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order has been successfully placed.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {orderId && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Order Number:</p>
                  <p className="font-mono font-semibold text-lg">{orderId}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold">What happens next?</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Confirmation Email</h4>
                      <p className="text-xs text-muted-foreground">
                        You'll receive an order confirmation email shortly with all the details.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Order Processing</h4>
                      <p className="text-xs text-muted-foreground">
                        We'll start processing your order and prepare it for shipping.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Shipping Updates</h4>
                      <p className="text-xs text-muted-foreground">
                        You'll receive tracking information once your order ships.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/orders">
                    <Button variant="outline" className="w-full">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      View Orders
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button className="w-full">
                      <Home className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Need help? Contact our support team at{' '}
                  <a href="mailto:support@gamestore.com" className="text-primary hover:underline">
                    support@gamestore.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}; 
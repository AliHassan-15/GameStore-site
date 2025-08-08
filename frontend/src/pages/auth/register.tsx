import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User, Phone, CreditCard, MapPin, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  // Optional payment details
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  // Optional address details
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    // watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      
      // Prepare registration data
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        // Optional payment details
        paymentDetails: showPaymentDetails ? {
          cardNumber: data.cardNumber,
          cardExpiry: data.cardExpiry,
          cardCvc: data.cardCvc,
        } : undefined,
        // Optional address details
        addressDetails: showAddressDetails ? {
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        } : undefined,
      };

      await registerUser(registrationData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
            <p className="text-muted-foreground">
              Join GameStore and start your gaming journey
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        className="pl-10"
                        {...register('firstName')}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-destructive text-sm">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        className="pl-10"
                        {...register('lastName')}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-destructive text-sm">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      className="pl-10"
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-destructive text-sm">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        className="pl-10 pr-10"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-sm">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Payment Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showPayment"
                    checked={showPaymentDetails}
                    onChange={(e) => setShowPaymentDetails(e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <label htmlFor="showPayment" className="text-sm font-medium">
                    Add payment details now (optional)
                  </label>
                </div>

                {showPaymentDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 p-4 border rounded-lg bg-muted/50"
                  >
                    <h4 className="font-semibold flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Information
                    </h4>
                    
                    <div className="space-y-2">
                      <label htmlFor="cardNumber" className="text-sm font-medium">
                        Card Number
                      </label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        {...register('cardNumber')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="cardExpiry" className="text-sm font-medium">
                          Expiry Date
                        </label>
                        <Input
                          id="cardExpiry"
                          placeholder="MM/YY"
                          {...register('cardExpiry')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="cardCvc" className="text-sm font-medium">
                          CVC
                        </label>
                        <Input
                          id="cardCvc"
                          placeholder="123"
                          {...register('cardCvc')}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Optional Address Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showAddress"
                    checked={showAddressDetails}
                    onChange={(e) => setShowAddressDetails(e.target.checked)}
                    className="w-4 h-4 text-primary"
                  />
                  <label htmlFor="showAddress" className="text-sm font-medium">
                    Add shipping address now (optional)
                  </label>
                </div>

                {showAddressDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 p-4 border rounded-lg bg-muted/50"
                  >
                    <h4 className="font-semibold flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Shipping Address
                    </h4>
                    
                    <div className="space-y-2">
                      <label htmlFor="address" className="text-sm font-medium">
                        Street Address
                      </label>
                      <Input
                        id="address"
                        placeholder="Enter your street address"
                        {...register('address')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="city" className="text-sm font-medium">
                          City
                        </label>
                        <Input
                          id="city"
                          placeholder="Enter your city"
                          {...register('city')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="state" className="text-sm font-medium">
                          State
                        </label>
                        <Input
                          id="state"
                          placeholder="Enter your state"
                          {...register('state')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="zipCode" className="text-sm font-medium">
                          ZIP Code
                        </label>
                        <Input
                          id="zipCode"
                          placeholder="Enter ZIP code"
                          {...register('zipCode')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="country" className="text-sm font-medium">
                        Country
                      </label>
                      <Input
                        id="country"
                        placeholder="Enter your country"
                        {...register('country')}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}; 
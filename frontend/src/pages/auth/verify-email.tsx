import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/verify-email', { token });
      setIsVerified(true);
      toast({
        title: "Success",
        description: "Email verified successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to verify email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/resend-verification');
      toast({
        title: "Success",
        description: "Verification email sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              Please check your email for a verification link or request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={resendVerification}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/auth/login')}
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email Verified!</CardTitle>
            <CardDescription>
              Your email has been verified successfully. You can now log in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth/login')}
              className="w-full"
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifying Email</CardTitle>
          <CardDescription>
            Please wait while we verify your email address...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            {isLoading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
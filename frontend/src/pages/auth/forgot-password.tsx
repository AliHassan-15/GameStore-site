import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <p className="text-muted-foreground">
            Enter your email to reset your password
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Password reset form will be implemented here.
          </p>
          <Link to="/login">
            <Button className="w-full">Back to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}; 
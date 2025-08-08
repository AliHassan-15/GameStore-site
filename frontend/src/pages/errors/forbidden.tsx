import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Shield } from 'lucide-react';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Shield className="w-24 h-24 text-destructive" />
          </div>
          <h1 className="text-6xl font-bold text-destructive">403</h1>
          <h2 className="text-3xl font-semibold">Access Forbidden</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            You don't have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}; 
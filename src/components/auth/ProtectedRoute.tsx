import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onAuthRequired?: () => void;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  onAuthRequired 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-royal">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-gradient-to-br from-bone/50 to-powder/30 rounded-2xl border border-powder/30 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-civic w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          
          <h3 className="text-xl font-semibold text-royal mb-2">
            Sign in Required
          </h3>
          
          <p className="text-royal/70 mb-6">
            You need to be signed in to access this feature. Join CivicTrack to start making a difference in your community.
          </p>
          
          <Button
            variant="premium"
            size="lg"
            onClick={onAuthRequired}
            className="w-full sm:w-auto"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
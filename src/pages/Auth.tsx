import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

export function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    (searchParams.get('mode') as 'signin' | 'signup') || 'signin'
  );

  const handleAuthSuccess = () => {
    const returnTo = searchParams.get('returnTo') || '/';
    navigate(returnTo);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-royal/5 via-transparent to-powder/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 text-royal/70 hover:text-royal hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CivicTrack
        </Button>

        {/* Auth Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-glow border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-civic p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Join CivicTrack'}
            </h1>
            <p className="text-powder opacity-90">
              {mode === 'signin' 
                ? 'Sign in to continue making a difference' 
                : 'Start making your community better today'
              }
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-bone/30 border-b border-powder/20">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 ${
                mode === 'signin'
                  ? 'bg-white text-royal border-b-2 border-royal'
                  : 'text-royal/70 hover:text-royal hover:bg-white/50'
              }`}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-white text-royal border-b-2 border-royal'
                  : 'text-royal/70 hover:text-royal hover:bg-white/50'
              }`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {mode === 'signin' ? (
              <SignInForm onSuccess={handleAuthSuccess} />
            ) : (
              <SignUpForm onSuccess={handleAuthSuccess} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-royal/60 text-sm">
            By continuing, you agree to CivicTrack's{' '}
            <a href="/terms" className="text-royal hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-royal hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
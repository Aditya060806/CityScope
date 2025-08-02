import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-royal/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-glow border border-white/20 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative bg-gradient-civic p-6 text-white">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Join CivicTrack'}
            </h2>
            <p className="text-powder opacity-90">
              {mode === 'signin' 
                ? 'Sign in to continue making a difference' 
                : 'Start making your community better today'
              }
            </p>
          </div>
        </div>

        {/* Toggle Tabs */}
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
            <SignInForm onSuccess={onClose} />
          ) : (
            <SignUpForm onSuccess={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
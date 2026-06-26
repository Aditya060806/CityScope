import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getCurrentUser, signInWithEmail as supabaseSignIn, signUpWithEmail as supabaseSignUp, signOut as supabaseSignOut } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthContext, AuthContextType } from './AuthContext';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is available
    if (!supabase) {
      console.warn('⚠️  Supabase not configured, running in offline mode');
      setIsLoading(false);
      return;
    }

    // Helper: fetch role from users table
    const fetchDbRole = async (userId: string): Promise<string> => {
      try {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
        return data?.role || 'user';
      } catch {
        return 'user';
      }
    };

    // Build user object SYNCHRONOUSLY from session data, then update role in background
    const setUserFromSession = (su: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
      // Set immediately so ProtectedRoute sees a user right away
      const basicUser: User = {
        id: su.id,
        email: su.email || '',
        name: su.user_metadata?.name || su.user_metadata?.full_name,
        avatar: su.user_metadata?.avatar_url,
        role: 'user', // default — updated below
      };
      setUser(basicUser);

      // Fetch real role from DB in background
      fetchDbRole(su.id).then(dbRole => {
        setUser(prev => prev && prev.id === su.id ? { ...prev, role: dbRole } : prev);
      });
    };

    let initialDone = false;

    // Hard safety net — force loading off after 4 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (!initialDone) {
        console.warn('⚠️ Auth init safety timeout — forcing loading off');
        initialDone = true;
        setIsLoading(false);
      }
    }, 4000);

    // Listen for auth changes (set up FIRST so we don't miss INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUserFromSession(session.user);
        } else {
          setUser(null);
        }
        if (!initialDone) {
          initialDone = true;
          clearTimeout(safetyTimer);
          setIsLoading(false);
        }
      }
    );

    // Also try getUser() in case onAuthStateChange doesn't fire
    getCurrentUser().then((currentUser) => {
      if (currentUser && !initialDone) {
        setUserFromSession(currentUser);
      }
      if (!initialDone) {
        initialDone = true;
        clearTimeout(safetyTimer);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!initialDone) {
        initialDone = true;
        clearTimeout(safetyTimer);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!supabase) throw new Error('Authentication service not available');
    try {
      // Clear any corrupted sessions
      await supabase.auth.signOut();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // onAuthStateChange will set the user
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<void> => {
    if (!supabase) throw new Error('Authentication service not available');
    try {
      const { error } = await supabaseSignUp(email, password, name || '');
      if (error) {
        // error is already thrown in supabaseSignUp, but for type safety:
        throw error;
      }
      // onAuthStateChange will set the user
    } catch (error: unknown) {
      // Pass through detailed error for UI
      if (error instanceof Error) throw error;
      throw new Error('An error occurred during sign up');
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    if (!supabase) throw new Error('Authentication service not available');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      // Browser will redirect to Google; onAuthStateChange handles the rest
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during Google sign in';
      throw new Error(errorMessage);
    }
  };

  const signOut = async (): Promise<void> => {
    if (!supabase) throw new Error('Authentication service not available');
    try {
      await supabaseSignOut();
      setUser(null);
      // onAuthStateChange will also fire
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign out';
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!supabase) throw new Error('Authentication service not available');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during password reset';
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

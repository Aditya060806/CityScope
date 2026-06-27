import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

const TUTORIAL_STORAGE_KEY = 'cityscope_tutorial_completed';
const TUTORIAL_VERSION = '1.0'; // Increment when tutorial steps change
const NEW_USER_THRESHOLD_HOURS = 24; // Consider user "new" if account created within last 24 hours

// For testing: Set this to true in localStorage to force show tutorial
const FORCE_TUTORIAL_KEY = 'cityscope_force_tutorial';

// For restart tutorial: Set this to true when user explicitly restarts tutorial
const RESTART_TUTORIAL_KEY = 'cityscope_restart_tutorial';

export interface TutorialState {
  isCompleted: boolean;
  currentStep: number;
  isActive: boolean;
}

export const useTutorial = () => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if tutorial should be shown
  useEffect(() => {
    const checkTutorialStatus = async () => {
      setIsLoading(true);
      
      try {
        // Check if tutorial is forced (for testing)
        const forceTutorial = localStorage.getItem(FORCE_TUTORIAL_KEY) === 'true';
        
        // Check if tutorial was restarted by user
        const restartTutorial = localStorage.getItem(RESTART_TUTORIAL_KEY) === 'true';
        
        // Check localStorage first (works for both anonymous and logged-in users)
        const localCompleted = localStorage.getItem(`${TUTORIAL_STORAGE_KEY}_${TUTORIAL_VERSION}`);
        
        // If forced or restarted, show tutorial regardless of completion status
        if (forceTutorial || restartTutorial) {
          setIsCompleted(false);
          setIsActive(true);
          setIsLoading(false);
          // Clear restart flag so it doesn't persist forever
          if (restartTutorial) {
            localStorage.removeItem(RESTART_TUTORIAL_KEY);
          }
          return;
        }
        
        // If already completed in localStorage and not forced/restarted, don't show
        if (localCompleted === 'true') {
          setIsCompleted(true);
          setIsActive(false);
          setIsLoading(false);
          return;
        }

        // For anonymous users, show tutorial if not completed
        if (!user?.id) {
          setIsCompleted(false);
          setIsActive(true);
          setIsLoading(false);
          return;
        }

        // For logged-in users, check database
        if (supabase && user.id) {
          try {
            // Check user's tutorial completion status and account creation date
            const { data, error } = await supabase
              .from('users')
              .select('preferences, created_at')
              .eq('id', user.id)
              .single();

            if (!error && data) {
              // Check if tutorial was completed in database
              const preferences = data.preferences 
                ? (typeof data.preferences === 'string' 
                    ? JSON.parse(data.preferences) 
                    : data.preferences)
                : {};
              
              if (preferences?.tutorial_completed === true) {
                // User has completed tutorial - never show again
                setIsCompleted(true);
                setIsActive(false);
                localStorage.setItem(`${TUTORIAL_STORAGE_KEY}_${TUTORIAL_VERSION}`, 'true');
                setIsLoading(false);
                return;
              }

              // Check if user is new (account created within threshold)
              const createdAt = data.created_at ? new Date(data.created_at) : null;
              const isNewUser = createdAt && (Date.now() - createdAt.getTime()) < (NEW_USER_THRESHOLD_HOURS * 60 * 60 * 1000);
              
              // Show tutorial if user is NEW and hasn't completed it
              if (isNewUser) {
                setIsCompleted(false);
                setIsActive(true);
                setIsLoading(false);
                return;
              } else {
                // Existing user who hasn't completed tutorial - don't show (they're not new)
                setIsCompleted(true);
                setIsActive(false);
                setIsLoading(false);
                return;
              }
            } else {
              // User record doesn't exist or error - treat as new user if localStorage doesn't show completion
              setIsCompleted(false);
              setIsActive(true);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.warn('Failed to check tutorial status from database:', error);
            // On error, show tutorial if localStorage doesn't show completion (treat as new user)
            setIsCompleted(false);
            setIsActive(true);
            setIsLoading(false);
            return;
          }
        }

        // Fallback for logged-in users without database access - show tutorial if not completed
        setIsCompleted(false);
        setIsActive(true);
      } catch (error) {
        console.error('Error checking tutorial status:', error);
        // On error, default to not showing tutorial (safer for existing users)
        setIsCompleted(true);
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [user?.id]);

  // Mark tutorial as completed
  const completeTutorial = async () => {
    setIsCompleted(true);
    setIsActive(false);
    localStorage.setItem(`${TUTORIAL_STORAGE_KEY}_${TUTORIAL_VERSION}`, 'true');
    // Clear restart flag when tutorial is completed
    localStorage.removeItem(RESTART_TUTORIAL_KEY);

    // Save to database if user is logged in
    if (user?.id && supabase) {
      try {
        // Get current preferences
        const { data: userData } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user.id)
          .single();

        const currentPreferences = userData?.preferences 
          ? (typeof userData.preferences === 'string' 
              ? JSON.parse(userData.preferences) 
              : userData.preferences)
          : {};

        // Update preferences
        const updatedPreferences = {
          ...currentPreferences,
          tutorial_completed: true,
          tutorial_completed_at: new Date().toISOString(),
          tutorial_version: TUTORIAL_VERSION,
        };

        await supabase
          .from('users')
          .update({ preferences: updatedPreferences })
          .eq('id', user.id);
      } catch (error) {
        console.warn('Failed to save tutorial completion to database:', error);
      }
    }
  };

  // Skip tutorial
  const skipTutorial = () => {
    // Clear restart flag when tutorial is skipped
    localStorage.removeItem(RESTART_TUTORIAL_KEY);
    completeTutorial();
  };

  // Restart tutorial (for testing or user request)
  // Note: This should only be used for testing or when user explicitly requests it
  const restartTutorial = async () => {
    // Set flag to force tutorial to show on next page load
    localStorage.setItem(RESTART_TUTORIAL_KEY, 'true');
    localStorage.removeItem(`${TUTORIAL_STORAGE_KEY}_${TUTORIAL_VERSION}`);
    
    // Set state immediately so tutorial shows right away (if user doesn't reload)
    setIsCompleted(false);
    setIsActive(true);
    
    // Also remove from database if user is logged in
    if (user?.id && supabase) {
      try {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.warn('Failed to fetch user preferences:', fetchError);
          return;
        }

        if (data?.preferences) {
          const preferences = typeof data.preferences === 'string' 
            ? JSON.parse(data.preferences) 
            : data.preferences;
          
          const updatedPreferences = {
            ...preferences,
            tutorial_completed: false,
          };
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ preferences: updatedPreferences })
            .eq('id', user.id);

          if (updateError) {
            console.warn('Failed to reset tutorial in database:', updateError);
          }
        }
      } catch (error) {
        console.warn('Failed to reset tutorial in database:', error);
      }
    }
    
    console.log('✅ Tutorial restart initiated - will show on next page load');
  };

  return {
    isCompleted,
    isActive,
    isLoading,
    completeTutorial,
    skipTutorial,
    restartTutorial,
  };
};

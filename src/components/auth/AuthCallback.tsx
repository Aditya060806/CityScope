import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Handling OAuth callback...');
        
        // Get the session from the URL hash/fragment
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          navigate('/auth?error=callback_failed');
          return;
        }
        
        if (data.session) {
          console.log('✅ OAuth callback successful, user authenticated');
          navigate('/');
        } else {
          console.log('ℹ️ No session found, redirecting to auth');
          navigate('/auth');
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error);
        navigate('/auth?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-sleek flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold text-royal">Completing sign in...</p>
        <p className="text-sm text-gray-600 mt-2">Please wait while we process your authentication</p>
      </div>
    </div>
  );
};

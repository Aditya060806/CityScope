import { useState, useEffect } from 'react';
import { geminiAIService } from '@/services/GeminiAIService';

export const useAIStatus = () => {
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAI = async () => {
      setIsTesting(true);
      setError(null);
      
      try {
        // First validate API key format
        const keyValidation = geminiAIService.validateApiKey();
        if (!keyValidation.isValid) {
          setError(keyValidation.error || 'Invalid API key format');
          setIsAIEnabled(false);
          return;
        }

        // Test API connection
        const isWorking = await geminiAIService.testConnection();
        setIsAIEnabled(isWorking);
        
        if (!isWorking) {
          setError('AI services are not available. You can still use manual reporting.');
        }
      } catch (err: unknown) {
        setError(err.message || 'AI services are not available');
        setIsAIEnabled(false);
      } finally {
        setIsTesting(false);
      }
    };

    testAI();
  }, []);

  return {
    isAIEnabled,
    isTesting,
    error,
    retry: () => {
      const testAI = async () => {
        setIsTesting(true);
        setError(null);
        
        try {
          const isWorking = await geminiAIService.testConnection();
          setIsAIEnabled(isWorking);
          
          if (!isWorking) {
            setError('AI services are not available. You can still use manual reporting.');
          }
        } catch (err: unknown) {
          setError(err.message || 'AI services are not available');
          setIsAIEnabled(false);
        } finally {
          setIsTesting(false);
        }
      };
      
      testAI();
    }
  };
};

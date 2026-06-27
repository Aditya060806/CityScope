import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Zap,
  Camera,
  Mic,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { geminiAIService } from '@/services/GeminiAIService';

interface AIStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  className,
  showDetails = false
}) => {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');
  const [details, setDetails] = useState<{
    apiKey: boolean;
    connection: boolean;
    workingModel: string | null;
    lastCheck: Date | null;
  }>({
    apiKey: false,
    connection: false,
    workingModel: null,
    lastCheck: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkAIStatus = async () => {
    setIsRefreshing(true);
    try {
      // Check API key
      const keyValidation = geminiAIService.validateApiKey();
      
      // Check connection if key is valid
      let connectionStatus = false;
      let workingModel = null;
      
      if (keyValidation.isValid) {
        try {
          connectionStatus = await geminiAIService.testConnection();
          workingModel = geminiAIService.getWorkingModel();
        } catch (error) {
          console.warn('Connection test failed:', error);
        }
      }

      const newDetails = {
        apiKey: keyValidation.isValid,
        connection: connectionStatus,
        workingModel,
        lastCheck: new Date()
      };

      setDetails(newDetails);

      // Determine overall status
      if (!keyValidation.isValid) {
        setStatus('unavailable');
      } else if (connectionStatus) {
        setStatus('available');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('AI status check failed:', error);
      setStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAIStatus();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'unavailable':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-3 h-3" />;
      case 'unavailable':
        return <AlertCircle className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      case 'checking':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      default:
        return <Brain className="w-3 h-3" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'AI Available';
      case 'unavailable':
        return 'AI Unavailable';
      case 'error':
        return 'AI Error';
      case 'checking':
        return 'Checking AI...';
      default:
        return 'AI Status Unknown';
    }
  };

  if (!showDetails) {
    return (
      <Badge className={cn('text-xs', getStatusColor(), className)}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>
    );
  }

  return (
    <Card className={cn('card-sleek', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-royal" />
              <span className="font-semibold text-gray-900">AI Status</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkAIStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>

          {/* Overall Status */}
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
            {details.workingModel && (
              <Badge variant="outline" className="text-xs">
                {details.workingModel}
              </Badge>
            )}
          </div>

          {/* Detailed Status */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Key:</span>
              <div className="flex items-center gap-1">
                {details.apiKey ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={details.apiKey ? 'text-green-600' : 'text-red-600'}>
                  {details.apiKey ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connection:</span>
              <div className="flex items-center gap-1">
                {details.connection ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={details.connection ? 'text-green-600' : 'text-red-600'}>
                  {details.connection ? 'Connected' : 'Failed'}
                </span>
              </div>
            </div>

            {details.lastCheck && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Check:</span>
                <span className="text-gray-500 text-xs">
                  {details.lastCheck.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Available Features */}
          {status === 'available' && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Available Features:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  <Camera className="w-3 h-3 mr-1" />
                  Photo Analysis
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Transcription
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Text Analysis
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Smart Suggestions
                </Badge>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              AI features are currently unavailable. Please check your API configuration.
            </div>
          )}

          {/* Unavailable Message */}
          {status === 'unavailable' && (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
              AI features require a valid Gemini API key. Add VITE_GEMINI_API_KEY to your environment.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
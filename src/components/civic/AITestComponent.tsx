import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Camera,
  MessageSquare,
  Zap
} from 'lucide-react';
import { geminiAIService } from '@/services/GeminiAIService';
import { toast } from 'sonner';

export const AITestComponent: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingText, setIsTestingText] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [testText, setTestText] = useState('There is a large pothole on Main Street that is causing damage to vehicles');
  const [testResults, setTestResults] = useState<{
    textAnalysis?: {
      category: string;
      description: string;
      confidence: number;
    };
    imageAnalysis?: {
      category: string;
      description: string;
      confidence: number;
    };
    connection?: {
      status: string;
      responseTime: number;
    };
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isConnected = await geminiAIService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
      
      if (isConnected) {
        toast.success('✅ Gemini AI connection successful!');
      } else {
        toast.error('❌ Gemini AI connection failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('failed');
      toast.error('❌ Connection test failed: ' + (error as Error).message);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testTextAnalysis = async () => {
    setIsTestingText(true);
    try {
      const result = await geminiAIService.analyzeIssueDescription(testText);
      setTestResults({ type: 'text', data: result });
      toast.success('✅ Text analysis completed!');
    } catch (error) {
      console.error('Text analysis error:', error);
      toast.error('❌ Text analysis failed: ' + (error as Error).message);
    } finally {
      setIsTestingText(false);
    }
  };

  const testImageAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTestingImage(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const result = await geminiAIService.analyzeIssuePhoto(base64);
      setTestResults({ type: 'image', data: result });
      toast.success('✅ Image analysis completed!');
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('❌ Image analysis failed: ' + (error as Error).message);
    } finally {
      setIsTestingImage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="card-sleek">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-royal" />
            Gemini AI Test Suite
            <Badge variant="outline" className="text-xs">
              <TestTube className="w-3 h-3 mr-1" />
              Development Tool
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">API Connection Test</h3>
              <Badge className={getStatusColor(connectionStatus)}>
                {connectionStatus === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
                {connectionStatus === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                {connectionStatus === 'unknown' ? 'Not Tested' : 
                 connectionStatus === 'connected' ? 'Connected' : 'Failed'}
              </Badge>
            </div>
            
            <Button
              onClick={testConnection}
              disabled={isTestingConnection}
              className="btn-royal"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Test API Connection
                </>
              )}
            </Button>
          </div>

          {/* Text Analysis Test */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Text Analysis Test</h3>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to analyze..."
              className="min-h-20"
            />
            <Button
              onClick={testTextAnalysis}
              disabled={isTestingText || !testText.trim()}
              variant="outline"
            >
              {isTestingText ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Text...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Analyze Text
                </>
              )}
            </Button>
          </div>

          {/* Image Analysis Test */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Image Analysis Test</h3>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={testImageAnalysis}
                disabled={isTestingImage}
                className="flex-1"
              />
              {isTestingImage && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Image...
                </div>
              )}
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Badge variant="outline" className="mb-2">
                      {testResults.type === 'text' ? 'Text Analysis' : 'Image Analysis'}
                    </Badge>
                    <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                      {JSON.stringify(testResults.data, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* API Key Status */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">API Configuration</span>
            </div>
            <p className="text-sm text-blue-700">
              API Key: {import.meta.env.VITE_GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}
            </p>
            <p className="text-sm text-blue-700">
              Working Model: {geminiAIService.getWorkingModel() || 'Not determined'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
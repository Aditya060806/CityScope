import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/ComprehensiveAPIService';
import { issueService } from '@/services/IssueService';
import { useLocation } from '@/hooks/useLocation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const APITestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [pincode, setPincode] = useState('110001');
  const { getLocationFromPincode } = useLocation();

  const runTest = async (testName: string, testFn: () => Promise<unknown>) => {
    setTestResults(prev => ({ ...prev, [testName]: 'pending' }));
    try {
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: 'success' }));
    } catch (error) {
      console.error(`${testName} failed:`, error);
      setTestResults(prev => ({ ...prev, [testName]: 'error' }));
    }
  };

  const testSupabaseConnection = async () => {
    const { issues } = await issueService.getIssues({ limit: 1 });
    console.log('Supabase test result:', issues);
  };

  const testIndiaPostAPI = async () => {
    const result = await getLocationFromPincode(pincode);
    console.log('India Post API result:', result);
  };

  const testWeatherAPI = async () => {
    const weather = await apiService.getWeatherData(28.6139, 77.2090);
    console.log('Weather API result:', weather);
  };

  const testAIServices = async () => {
    const suggestions = await apiService.generateSmartSuggestions('Broken street light near park');
    console.log('AI suggestions result:', suggestions);
  };

  const testHealthCheck = async () => {
    const health = await apiService.healthCheck();
    console.log('Health check result:', health);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>API Integration Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.supabase)}
              <span>Supabase Database</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(testResults.supabase)}>
                {testResults.supabase || 'Not tested'}
              </Badge>
              <Button 
                size="sm" 
                onClick={() => runTest('supabase', testSupabaseConnection)}
                disabled={testResults.supabase === 'pending'}
              >
                Test
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.indiaPost)}
              <span>India Post API</span>
              <Input 
                value={pincode} 
                onChange={(e) => setPincode(e.target.value)}
                placeholder="PIN Code"
                className="w-24 h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(testResults.indiaPost)}>
                {testResults.indiaPost || 'Not tested'}
              </Badge>
              <Button 
                size="sm" 
                onClick={() => runTest('indiaPost', testIndiaPostAPI)}
                disabled={testResults.indiaPost === 'pending'}
              >
                Test
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.weather)}
              <span>Weather API</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(testResults.weather)}>
                {testResults.weather || 'Not tested'}
              </Badge>
              <Button 
                size="sm" 
                onClick={() => runTest('weather', testWeatherAPI)}
                disabled={testResults.weather === 'pending'}
              >
                Test
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.ai)}
              <span>AI Services</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(testResults.ai)}>
                {testResults.ai || 'Not tested'}
              </Badge>
              <Button 
                size="sm" 
                onClick={() => runTest('ai', testAIServices)}
                disabled={testResults.ai === 'pending'}
              >
                Test
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.health)}
              <span>System Health</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(testResults.health)}>
                {testResults.health || 'Not tested'}
              </Badge>
              <Button 
                size="sm" 
                onClick={() => runTest('health', testHealthCheck)}
                disabled={testResults.health === 'pending'}
              >
                Test
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            className="w-full" 
            onClick={() => {
              runTest('supabase', testSupabaseConnection);
              runTest('indiaPost', testIndiaPostAPI);
              runTest('weather', testWeatherAPI);
              runTest('ai', testAIServices);
              runTest('health', testHealthCheck);
            }}
          >
            Test All APIs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
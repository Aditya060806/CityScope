import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { testDatabaseConnection, initializeDatabase, DatabaseTestResult } from '@/utils/database-test';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const DatabaseStatus = () => {
  const [testResult, setTestResult] = useState<DatabaseTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await testDatabaseConnection();
      setTestResult(result);
    } catch (error) {
      console.error('Database test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDb = async () => {
    setIsInitializing(true);
    try {
      const success = await initializeDatabase();
      if (success) {
        await runTest(); // Re-test after initialization
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const getStatusColor = () => {
    if (!testResult) return 'gray';
    if (testResult.connected && testResult.tablesExist && testResult.canQuery) return 'green';
    if (testResult.connected) return 'yellow';
    return 'red';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'green') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (color === 'yellow') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <Card className="card-sleek">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="w-5 h-5 text-royal" />
          Database Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection</span>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={getStatusColor() === 'green' ? 'default' : 'destructive'}>
              {testResult?.details.connection || 'Unknown'}
            </Badge>
          </div>
        </div>

        {testResult && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tables</span>
                <Badge variant={testResult.tablesExist ? 'default' : 'destructive'}>
                  {testResult.details.tables.length}/4
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Query</span>
                <Badge variant={testResult.canQuery ? 'default' : 'destructive'}>
                  {testResult.canQuery ? 'Working' : 'Failed'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Insert</span>
                <Badge variant={testResult.canInsert ? 'default' : 'destructive'}>
                  {testResult.canInsert ? 'Working' : 'Failed'}
                </Badge>
              </div>
            </div>

            {testResult.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{testResult.error}</p>
              </div>
            )}

            {testResult.details.sampleData.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Found {testResult.details.sampleData.length} sample issues
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex gap-2">
          <Button
            onClick={runTest}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test
          </Button>
          
          {testResult && !testResult.tablesExist && (
            <Button
              onClick={initializeDb}
              disabled={isInitializing}
              size="sm"
              className="flex-1 btn-royal"
            >
              {isInitializing ? 'Initializing...' : 'Initialize'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
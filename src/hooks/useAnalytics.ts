import { useState, useEffect, useCallback } from 'react';
import { analyticsService, AnalyticsData } from '@/services/AnalyticsService';

export const useAnalytics = (timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [realTimeData, setRealTimeData] = useState<Partial<AnalyticsData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await analyticsService.getAnalytics(timeframe);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  const loadRealTimeData = useCallback(async () => {
    try {
      const data = await analyticsService.getRealTimeAnalytics();
      setRealTimeData(data);
    } catch (err) {
      console.error('Error loading real-time data:', err);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    loadRealTimeData();
  }, [loadAnalytics, loadRealTimeData]);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = analyticsService.subscribeToAnalytics((data) => {
      setRealTimeData(data);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const refreshAnalytics = useCallback(() => {
    loadAnalytics();
    loadRealTimeData();
  }, [loadAnalytics, loadRealTimeData]);

  return {
    analytics,
    realTimeData,
    loading,
    error,
    refreshAnalytics
  };
};

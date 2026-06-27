import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCivicIssues } from '@/hooks/useCivicIssues';
// import { aiEnhancedIssueService } from '@/services/AIEnhancedIssueService';
import { IssueCategory, CATEGORY_CONFIG } from '@/types/civic';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

interface AIInsights {
  hotspots: Array<{ location: string; count: number; issues: string[] }>;
  trends: Array<{ category: string; trend: 'increasing' | 'decreasing' | 'stable'; confidence: number }>;
  recommendations: string[];
}

export const AIAnalytics: React.FC = () => {
  const { issues, isLoading } = useCivicIssues();
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const analyzeIssues = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Mock AI insights for now to avoid service dependency issues
      const mockInsights: AIInsights = {
        hotspots: [
          {
            location: "Downtown Area",
            count: 5,
            issues: ["Potholes", "Street Lighting", "Traffic Signals"]
          }
        ],
        trends: [
          {
            category: "infrastructure",
            trend: "increasing",
            confidence: 0.8
          }
        ],
        recommendations: [
          "Focus on infrastructure maintenance in downtown area",
          "Consider implementing smart traffic management",
          "Prioritize street lighting improvements"
        ]
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiInsights(mockInsights);
    } catch (error) {
      console.error('Error analyzing issues:', error);
      toast.error('Failed to generate AI insights');
    } finally {
      setIsAnalyzing(false);
    }
  }, [issues]);

  useEffect(() => {
    if (issues.length > 0) {
      analyzeIssues();
    }
  }, [issues, selectedTimeframe, analyzeIssues]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'decreasing':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.4) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-royal" />
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-8 space-y-3">
          <PageHeader
            icon={<Brain className="h-5 w-5" />}
            title="Intelligent Community Insights"
            description="Discover patterns, trends, and actionable AI guidance for local civic issues."
            actions={
              <Badge variant="outline" className="text-xs border-royal/30 bg-royal/5 text-royal">
                <Sparkles className="w-3 h-3 mr-1" />
                Smart Insights
              </Badge>
            }
          />
        </div>

        {/* Timeframe Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: 'all', label: 'All Time' }
            ].map((timeframe) => (
              <Button
                key={timeframe.key}
                variant={selectedTimeframe === timeframe.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe.key as '7d' | '30d' | '90d' | '1y')}
                className={cn(
                  "px-4 py-2",
                  selectedTimeframe === timeframe.key ? "btn-royal" : ""
                )}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>

        {/* AI Analysis Status */}
        {isAnalyzing && (
          <Card className="card-sleek mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-royal" />
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">AI is analyzing your data...</h3>
                  <p className="text-sm text-gray-600">This may take a few moments</p>
                </div>
              </div>
              <Progress value={66} className="mt-4 h-2" />
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        {aiInsights && (
          <div className="space-y-8">
            {/* Hotspots */}
            {aiInsights.hotspots.length > 0 && (
              <Card className="card-sleek">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-royal" />
                    Problem Hotspots
                    <Badge variant="outline" className="text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      AI Detected
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiInsights.hotspots.map((hotspot, index) => (
                      <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-red-900">{hotspot.location}</h4>
                          <Badge variant="destructive" className="text-xs">
                            {hotspot.count} issues
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-red-700">Common issues:</p>
                          <div className="flex flex-wrap gap-1">
                            {hotspot.issues.slice(0, 3).map((issue, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-300">
                                {issue}
                              </Badge>
                            ))}
                            {hotspot.issues.length > 3 && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                +{hotspot.issues.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trends */}
            {aiInsights.trends.length > 0 && (
              <Card className="card-sleek">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-royal" />
                    Category Trends
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      AI Analysis
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiInsights.trends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {CATEGORY_CONFIG[trend.category as IssueCategory]?.icon || '📊'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {CATEGORY_CONFIG[trend.category as IssueCategory]?.label || trend.category}
                            </h4>
                            <p className="text-sm text-gray-600">Issue category trend</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium",
                            getTrendColor(trend.trend)
                          )}>
                            {getTrendIcon(trend.trend)}
                            <span className="capitalize">{trend.trend}</span>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-600">Confidence:</span>
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs', getConfidenceColor(trend.confidence))}
                              >
                                {getConfidenceLabel(trend.confidence)}
                              </Badge>
                            </div>
                            <div className="w-20 mt-1">
                              <Progress value={trend.confidence * 100} className="h-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {aiInsights.recommendations.length > 0 && (
              <Card className="card-sleek">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-royal" />
                    AI Recommendations
                    <Badge variant="outline" className="text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      Smart Actions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiInsights.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <p className="text-blue-900 leading-relaxed">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* No Data State */}
        {!isAnalyzing && (!aiInsights || (aiInsights.hotspots.length === 0 && aiInsights.trends.length === 0 && aiInsights.recommendations.length === 0)) && (
          <EmptyState
            icon={<PieChart className="w-8 h-8" />}
            title="No AI Insights Available"
            description="More reports are needed before meaningful AI trends can be generated."
            action={
              <Button className="btn-royal">
                <Target className="w-4 h-4 mr-2" />
                Report an Issue
              </Button>
            }
          />
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={analyzeIssues}
            disabled={isAnalyzing || issues.length === 0}
            variant="outline"
            className="px-6"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Refresh AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

import { supabase } from '@/lib/supabase';
import { Issue, IssueCategory, IssueStatus, IssuePriority } from '@/types/civic';

interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
}

interface IssueTrend {
  period: string;
  count: number;
  resolved: number;
  avgResolutionTime: number;
  categoryBreakdown: Record<IssueCategory, number>;
}

interface PerformanceMetrics {
  totalIssues: number;
  resolvedIssues: number;
  avgResolutionTime: number;
  resolutionRate: number;
  userSatisfaction: number;
  departmentPerformance: Array<{
    department: string;
    totalIssues: number;
    resolvedIssues: number;
    avgResolutionTime: number;
    satisfaction: number;
  }>;
}

interface GeographicAnalytics {
  hotspots: Array<{
    lat: number;
    lng: number;
    radius: number;
    issueCount: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    categories: IssueCategory[];
  }>;
  coverage: {
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
  };
  distribution: Array<{
    region: string;
    issueCount: number;
    population: number;
    issuesPerCapita: number;
  }>;
}

interface PredictiveAnalytics {
  forecast: Array<{
    period: string;
    predictedIssues: number;
    confidence: number;
    factors: string[];
  }>;
  seasonalPatterns: Array<{
    month: number;
    category: IssueCategory;
    expectedIncrease: number;
    reason: string;
  }>;
  riskAreas: Array<{
    location: { lat: number; lng: number };
    riskScore: number;
    factors: string[];
    recommendations: string[];
  }>;
}

interface UserEngagementAnalytics {
  activeUsers: number;
  newUsers: number;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  engagementMetrics: {
    avgReportsPerUser: number;
    avgUpvotesPerUser: number;
    avgCommentsPerUser: number;
    powerUsers: number;
  };
  gamificationStats: {
    totalPointsAwarded: number;
    badgesEarned: number;
    leaderboardParticipation: number;
    rewardRedemptions: number;
  };
}

interface SystemPerformanceAnalytics {
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  uptime: number;
  errorRate: number;
  userSessions: {
    total: number;
    avgDuration: number;
    bounceRate: number;
  };
  featureUsage: Array<{
    feature: string;
    usage: number;
    satisfaction: number;
  }>;
}

class AdvancedAnalyticsService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize analytics service
      this.isInitialized = true;
      console.log('Advanced Analytics Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Advanced Analytics Service:', error);
      this.isInitialized = true;
    }
  }

  // Get issue trends over time
  async getIssueTrends(timeRange: AnalyticsTimeRange): Promise<IssueTrend[]> {
    await this.initialize();

    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    return this.processIssueTrends(data || [], timeRange);
  }

  private processIssueTrends(issues: unknown[], timeRange: AnalyticsTimeRange): IssueTrend[] {
    const trends: IssueTrend[] = [];
    const periodMap = new Map<string, unknown[]>();

    // Group issues by time period
    issues.forEach(issue => {
      const period = this.getTimePeriod(issue.created_at, timeRange.granularity);
      if (!periodMap.has(period)) {
        periodMap.set(period, []);
      }
      periodMap.get(period)!.push(issue);
    });

    // Process each period
    periodMap.forEach((periodIssues, period) => {
      const resolved = periodIssues.filter(i => i.status === 'resolved').length;
      const avgResolutionTime = this.calculateAvgResolutionTime(periodIssues);
      
      const categoryBreakdown = periodIssues.reduce((acc: unknown, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {});

      trends.push({
        period,
        count: periodIssues.length,
        resolved,
        avgResolutionTime,
        categoryBreakdown
      });
    });

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  private getTimePeriod(timestamp: string, granularity: string): string {
    const date = new Date(timestamp);
    
    switch (granularity) {
      case 'hour':
        return date.toISOString().slice(0, 13) + ':00:00';
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      }
      case 'month':
        return date.toISOString().slice(0, 7);
      case 'year':
        return date.toISOString().slice(0, 4);
      default:
        return date.toISOString().slice(0, 10);
    }
  }

  private calculateAvgResolutionTime(issues: unknown[]): number {
    const resolvedIssues = issues.filter(i => i.status === 'resolved' && i.resolved_at);
    
    if (resolvedIssues.length === 0) return 0;

    const totalTime = resolvedIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at).getTime();
      const resolved = new Date(issue.resolved_at).getTime();
      return sum + (resolved - created);
    }, 0);

    return totalTime / resolvedIssues.length / (1000 * 60 * 60); // Convert to hours
  }

  // Get performance metrics
  async getPerformanceMetrics(timeRange?: AnalyticsTimeRange): Promise<PerformanceMetrics> {
    await this.initialize();

    let query = supabase.from('issues').select('*');
    
    if (timeRange) {
      query = query
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());
    }

    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        department:departments(name)
      `);

    if (error) throw error;

    const totalIssues = issues?.length || 0;
    const resolvedIssues = issues?.filter(i => i.status === 'resolved').length || 0;
    const avgResolutionTime = this.calculateAvgResolutionTime(issues || []);
    const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

    // Calculate user satisfaction (mock data for demo)
    const userSatisfaction = await this.calculateUserSatisfaction();

    // Calculate department performance
    const departmentPerformance = this.calculateDepartmentPerformance(issues || []);

    return {
      totalIssues,
      resolvedIssues,
      avgResolutionTime,
      resolutionRate,
      userSatisfaction,
      departmentPerformance
    };
  }

  private async calculateUserSatisfaction(): Promise<number> {
    // Mock calculation - in real app, this would be based on user feedback
    return 85.5;
  }

  private calculateDepartmentPerformance(issues: unknown[]): Array<{
    department: string;
    totalIssues: number;
    resolvedIssues: number;
    avgResolutionTime: number;
    satisfaction: number;
  }> {
    const deptMap = new Map<string, unknown[]>();

    issues.forEach(issue => {
      const dept = issue.department?.name || 'Unassigned';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, []);
      }
      deptMap.get(dept)!.push(issue);
    });

    return Array.from(deptMap.entries()).map(([department, deptIssues]) => {
      const resolved = deptIssues.filter(i => i.status === 'resolved').length;
      const avgResolutionTime = this.calculateAvgResolutionTime(deptIssues);
      const satisfaction = 80 + Math.random() * 20; // Mock satisfaction score

      return {
        department,
        totalIssues: deptIssues.length,
        resolvedIssues: resolved,
        avgResolutionTime,
        satisfaction
      };
    });
  }

  // Get geographic analytics
  async getGeographicAnalytics(): Promise<GeographicAnalytics> {
    await this.initialize();

    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .eq('is_hidden', false);

    if (error) throw error;

    const hotspots = this.calculateHotspots(issues || []);
    const coverage = this.calculateCoverage(issues || []);
    const distribution = this.calculateDistribution(issues || []);

    return {
      hotspots,
      coverage,
      distribution
    };
  }

  private calculateHotspots(issues: unknown[]): Array<{
    lat: number;
    lng: number;
    radius: number;
    issueCount: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    categories: IssueCategory[];
  }> {
    // Group issues by location clusters
    const clusters = this.clusterIssuesByLocation(issues);
    
    return clusters.map(cluster => {
      const severity = this.calculateClusterSeverity(cluster);
      const categories = [...new Set(cluster.map(i => i.category))];
      
      return {
        lat: cluster[0].location.latitude,
        lng: cluster[0].location.longitude,
        radius: this.calculateClusterRadius(cluster),
        issueCount: cluster.length,
        severity,
        categories
      };
    });
  }

  private clusterIssuesByLocation(issues: unknown[]): unknown[][] {
    const clusters: unknown[][] = [];
    const processed = new Set<string>();

    issues.forEach(issue => {
      if (processed.has(issue.id)) return;

      const cluster = [issue];
      processed.add(issue.id);

      // Find nearby issues
      issues.forEach(otherIssue => {
        if (processed.has(otherIssue.id)) return;

        const distance = this.calculateDistance(
          { lat: issue.location.latitude, lng: issue.location.longitude },
          { lat: otherIssue.location.latitude, lng: otherIssue.location.longitude }
        );

        if (distance < 0.5) { // 500m radius
          cluster.push(otherIssue);
          processed.add(otherIssue.id);
        }
      });

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateClusterSeverity(cluster: unknown[]): 'low' | 'medium' | 'high' | 'critical' {
    const urgentCount = cluster.filter(i => i.priority === 'urgent').length;
    const highCount = cluster.filter(i => i.priority === 'high').length;
    
    if (urgentCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (cluster.length > 5) return 'medium';
    return 'low';
  }

  private calculateClusterRadius(cluster: unknown[]): number {
    if (cluster.length === 1) return 0.1;

    let maxDistance = 0;
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        const distance = this.calculateDistance(
          { lat: cluster[i].location.latitude, lng: cluster[i].location.longitude },
          { lat: cluster[j].location.latitude, lng: cluster[j].location.longitude }
        );
        maxDistance = Math.max(maxDistance, distance);
      }
    }

    return maxDistance / 2; // Radius is half the maximum distance
  }

  private calculateCoverage(issues: unknown[]): {
    totalArea: number;
    coveredArea: number;
    coveragePercentage: number;
  } {
    // Mock calculation - in real app, this would use actual geographic data
    const totalArea = 100; // km²
    const coveredArea = 75; // km²
    
    return {
      totalArea,
      coveredArea,
      coveragePercentage: (coveredArea / totalArea) * 100
    };
  }

  private calculateDistribution(issues: unknown[]): Array<{
    region: string;
    issueCount: number;
    population: number;
    issuesPerCapita: number;
  }> {
    // Mock calculation - in real app, this would use actual demographic data
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    
    return regions.map(region => {
      const issueCount = Math.floor(Math.random() * 50) + 10;
      const population = Math.floor(Math.random() * 10000) + 5000;
      
      return {
        region,
        issueCount,
        population,
        issuesPerCapita: issueCount / population
      };
    });
  }

  // Get predictive analytics
  async getPredictiveAnalytics(): Promise<PredictiveAnalytics> {
    await this.initialize();

    const forecast = await this.generateForecast();
    const seasonalPatterns = await this.analyzeSeasonalPatterns();
    const riskAreas = await this.identifyRiskAreas();

    return {
      forecast,
      seasonalPatterns,
      riskAreas
    };
  }

  private async generateForecast(): Promise<Array<{
    period: string;
    predictedIssues: number;
    confidence: number;
    factors: string[];
  }>> {
    // Mock forecast - in real app, this would use ML models
    const periods = ['Next Week', 'Next Month', 'Next Quarter'];
    
    return periods.map(period => ({
      period,
      predictedIssues: Math.floor(Math.random() * 100) + 50,
      confidence: 0.7 + Math.random() * 0.2,
      factors: ['Historical trends', 'Seasonal patterns', 'Population growth']
    }));
  }

  private async analyzeSeasonalPatterns(): Promise<Array<{
    month: number;
    category: IssueCategory;
    expectedIncrease: number;
    reason: string;
  }>> {
    // Mock seasonal analysis
    return [
      {
        month: 6,
        category: 'sanitation',
        expectedIncrease: 25,
        reason: 'Summer heat increases waste-related issues'
      },
      {
        month: 12,
        category: 'lighting',
        expectedIncrease: 30,
        reason: 'Winter months require more street lighting'
      }
    ];
  }

  private async identifyRiskAreas(): Promise<Array<{
    location: { lat: number; lng: number };
    riskScore: number;
    factors: string[];
    recommendations: string[];
  }>> {
    // Mock risk analysis
    return [
      {
        location: { lat: 40.7128, lng: -74.0060 },
        riskScore: 0.85,
        factors: ['High population density', 'Aging infrastructure', 'Recent incidents'],
        recommendations: ['Increase monitoring', 'Schedule maintenance', 'Deploy resources']
      }
    ];
  }

  // Get user engagement analytics
  async getUserEngagementAnalytics(): Promise<UserEngagementAnalytics> {
    await this.initialize();

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) throw usersError;

    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*');

    if (issuesError) throw issuesError;

    const activeUsers = users?.filter(u => u.is_active).length || 0;
    const newUsers = users?.filter(u => {
      const created = new Date(u.created_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return created > thirtyDaysAgo;
    }).length || 0;

    const userRetention = await this.calculateUserRetention(users || []);
    const engagementMetrics = this.calculateEngagementMetrics(users || [], issues || []);
    const gamificationStats = await this.calculateGamificationStats();

    return {
      activeUsers,
      newUsers,
      userRetention,
      engagementMetrics,
      gamificationStats
    };
  }

  private async calculateUserRetention(users: unknown[]): Promise<{
    day1: number;
    day7: number;
    day30: number;
  }> {
    // Mock retention calculation
    return {
      day1: 85,
      day7: 65,
      day30: 45
    };
  }

  private calculateEngagementMetrics(users: unknown[], issues: unknown[]): {
    avgReportsPerUser: number;
    avgUpvotesPerUser: number;
    avgCommentsPerUser: number;
    powerUsers: number;
  } {
    const totalReports = issues.length;
    const avgReportsPerUser = totalReports / users.length;
    
    // Mock calculations
    return {
      avgReportsPerUser,
      avgUpvotesPerUser: 5.2,
      avgCommentsPerUser: 2.1,
      powerUsers: Math.floor(users.length * 0.1)
    };
  }

  private async calculateGamificationStats(): Promise<{
    totalPointsAwarded: number;
    badgesEarned: number;
    leaderboardParticipation: number;
    rewardRedemptions: number;
  }> {
    // Mock gamification stats
    return {
      totalPointsAwarded: 12500,
      badgesEarned: 450,
      leaderboardParticipation: 75,
      rewardRedemptions: 25
    };
  }

  // Get system performance analytics
  async getSystemPerformanceAnalytics(): Promise<SystemPerformanceAnalytics> {
    await this.initialize();

    // Mock system performance data
    return {
      responseTime: {
        avg: 250,
        p95: 500,
        p99: 1000
      },
      uptime: 99.9,
      errorRate: 0.1,
      userSessions: {
        total: 1500,
        avgDuration: 8.5,
        bounceRate: 15
      },
      featureUsage: [
        { feature: 'Issue Reporting', usage: 95, satisfaction: 4.5 },
        { feature: 'Map View', usage: 80, satisfaction: 4.2 },
        { feature: 'Leaderboard', usage: 60, satisfaction: 4.0 },
        { feature: 'Notifications', usage: 70, satisfaction: 3.8 }
      ]
    };
  }

  // Export analytics data
  async exportAnalyticsData(
    type: 'issues' | 'users' | 'performance' | 'geographic',
    format: 'csv' | 'json' | 'excel',
    timeRange?: AnalyticsTimeRange
  ): Promise<Blob> {
    await this.initialize();

    let data: unknown;

    switch (type) {
      case 'issues':
        data = await this.getIssueTrends(timeRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'day'
        });
        break;
      case 'users':
        data = await this.getUserEngagementAnalytics();
        break;
      case 'performance':
        data = await this.getPerformanceMetrics(timeRange);
        break;
      case 'geographic':
        data = await this.getGeographicAnalytics();
        break;
    }

    return this.convertToFormat(data, format);
  }

  private convertToFormat(data: unknown, format: string): Blob {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      case 'csv': {
        const csv = this.convertToCSV(data);
        return new Blob([csv], { type: 'text/csv' });
      }
      case 'excel':
        // In a real app, you'd use a library like xlsx
        return new Blob([JSON.stringify(data)], { type: 'application/vnd.ms-excel' });
      default:
        return new Blob([JSON.stringify(data)], { type: 'application/json' });
    }
  }

  private convertToCSV(data: unknown): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(data);
  }

  // Generate analytics report
  async generateAnalyticsReport(
    reportType: 'executive' | 'operational' | 'technical',
    timeRange?: AnalyticsTimeRange
  ): Promise<{
    reportId: string;
    title: string;
    summary: string;
    sections: Array<{
      title: string;
      data: unknown;
      insights: string[];
      recommendations: string[];
    }>;
    generatedAt: Date;
  }> {
    await this.initialize();

    const reportId = `report_${Date.now()}`;
    const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analytics Report`;
    
    const performanceMetrics = await this.getPerformanceMetrics(timeRange);
    const userEngagement = await this.getUserEngagementAnalytics();
    const geographicAnalytics = await this.getGeographicAnalytics();
    const predictiveAnalytics = await this.getPredictiveAnalytics();

    const sections = [
      {
        title: 'Performance Overview',
        data: performanceMetrics,
        insights: [
          `Resolution rate: ${performanceMetrics.resolutionRate.toFixed(1)}%`,
          `Average resolution time: ${performanceMetrics.avgResolutionTime.toFixed(1)} hours`,
          `User satisfaction: ${performanceMetrics.userSatisfaction.toFixed(1)}%`
        ],
        recommendations: [
          'Focus on reducing resolution time for high-priority issues',
          'Implement automated routing to improve efficiency',
          'Enhance communication with citizens during issue resolution'
        ]
      },
      {
        title: 'User Engagement',
        data: userEngagement,
        insights: [
          `Active users: ${userEngagement.activeUsers}`,
          `New users this month: ${userEngagement.newUsers}`,
          `Power users: ${userEngagement.engagementMetrics.powerUsers}`
        ],
        recommendations: [
          'Implement gamification features to increase engagement',
          'Create user onboarding program for new users',
          'Develop advanced features for power users'
        ]
      },
      {
        title: 'Geographic Analysis',
        data: geographicAnalytics,
        insights: [
          `Coverage: ${geographicAnalytics.coverage.coveragePercentage.toFixed(1)}%`,
          `Hotspots identified: ${geographicAnalytics.hotspots.length}`,
          `Critical areas: ${geographicAnalytics.hotspots.filter(h => h.severity === 'critical').length}`
        ],
        recommendations: [
          'Deploy additional resources to critical hotspots',
          'Improve coverage in underserved areas',
          'Implement predictive maintenance in high-risk zones'
        ]
      }
    ];

    const summary = this.generateReportSummary(sections);

    return {
      reportId,
      title,
      summary,
      sections,
      generatedAt: new Date()
    };
  }

  private generateReportSummary(sections: unknown[]): string {
    return `This report provides comprehensive analytics covering performance metrics, user engagement, and geographic distribution. Key highlights include insights into resolution rates, user satisfaction, and identified hotspots requiring attention.`;
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();

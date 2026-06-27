import { supabase } from '@/lib/supabase';
import { Issue, IssueCategory, Department } from '@/types/civic';

interface RoutingContext {
  issue: Issue;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  departments: Department[];
  historicalData: {
    similarIssues: Issue[];
    departmentPerformance: Record<string, {
      averageResolutionTime: number;
      successRate: number;
      workload: number;
    }>;
  };
}

interface RoutingDecision {
  departmentId: string;
  departmentName: string;
  confidence: number;
  reasoning: string[];
  estimatedResolutionTime: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class MLRoutingService {
  private model: unknown = null;
  private isModelLoaded = false;

  // Initialize ML model (mock implementation)
  async initializeModel() {
    try {
      // In a real implementation, you would load a trained ML model
      // This could be a TensorFlow.js model, ONNX model, or API call to ML service
      console.log('Initializing ML routing model...');
      
      // Mock model initialization
      this.model = {
        predict: this.mockPredict.bind(this),
        isLoaded: true
      };
      
      this.isModelLoaded = true;
      console.log('ML routing model initialized successfully');
    } catch (error) {
      console.error('Error initializing ML model:', error);
      this.isModelLoaded = false;
    }
  }

  // Main routing function
  async routeIssue(issue: Issue): Promise<RoutingDecision> {
    if (!this.isModelLoaded) {
      await this.initializeModel();
    }

    try {
      // Gather routing context
      const context = await this.gatherRoutingContext(issue);
      
      // Apply ML-based routing
      const mlDecision = await this.applyMLRouting(context);
      
      // Apply business rules
      const finalDecision = await this.applyBusinessRules(mlDecision, context);
      
      // Save routing decision
      await this.saveRoutingDecision(issue.id, finalDecision);
      
      return finalDecision;
    } catch (error) {
      console.error('Error routing issue:', error);
      
      // Fallback to rule-based routing
      return await this.fallbackRouting(issue);
    }
  }

  // Gather context for routing decision
  private async gatherRoutingContext(issue: Issue): Promise<RoutingContext> {
    // Get all departments
    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true);

    // Get similar historical issues
    const { data: similarIssues } = await supabase
      .from('issues')
      .select('*')
      .eq('category', issue.category)
      .not('id', 'eq', issue.id)
      .limit(100);

    // Get department performance data
    const departmentPerformance = await this.getDepartmentPerformance();

    return {
      issue,
      location: issue.location,
      departments: departments || [],
      historicalData: {
        similarIssues: similarIssues || [],
        departmentPerformance
      }
    };
  }

  // Apply ML-based routing
  private async applyMLRouting(context: RoutingContext): Promise<RoutingDecision> {
    if (!this.model) {
      throw new Error('ML model not available');
    }

    // Prepare features for ML model
    const features = this.extractFeatures(context);
    
    // Get ML prediction
    const prediction = await this.model.predict(features);
    
    // Convert prediction to routing decision
    return this.convertPredictionToDecision(prediction, context);
  }

  // Extract features for ML model
  private extractFeatures(context: RoutingContext) {
    const { issue, location, historicalData } = context;
    
    // Text features from issue description
    const textFeatures = this.extractTextFeatures(issue.description);
    
    // Location features
    const locationFeatures = this.extractLocationFeatures(location);
    
    // Category features
    const categoryFeatures = this.extractCategoryFeatures(issue.category);
    
    // Historical features
    const historicalFeatures = this.extractHistoricalFeatures(historicalData);
    
    // Time features
    const timeFeatures = this.extractTimeFeatures(issue.createdAt);
    
    return {
      text: textFeatures,
      location: locationFeatures,
      category: categoryFeatures,
      historical: historicalFeatures,
      time: timeFeatures
    };
  }

  // Extract text features using NLP
  private extractTextFeatures(description: string) {
    // In a real implementation, you would use NLP libraries like:
    // - Natural Language Processing APIs
    // - Sentiment analysis
    // - Keyword extraction
    // - Named entity recognition
    
    const words = description.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    
    // Simple keyword-based features
    const urgencyKeywords = ['urgent', 'emergency', 'critical', 'immediate', 'asap'];
    const severityKeywords = ['severe', 'dangerous', 'broken', 'damaged', 'flooding'];
    const locationKeywords = ['street', 'road', 'intersection', 'building', 'park'];
    
    const urgencyScore = urgencyKeywords.reduce((score, keyword) => 
      score + (words.includes(keyword) ? 1 : 0), 0
    );
    
    const severityScore = severityKeywords.reduce((score, keyword) => 
      score + (words.includes(keyword) ? 1 : 0), 0
    );
    
    const locationScore = locationKeywords.reduce((score, keyword) => 
      score + (words.includes(keyword) ? 1 : 0), 0
    );
    
    return {
      wordCount,
      urgencyScore,
      severityScore,
      locationScore,
      hasNumbers: /\d+/.test(description),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(description)
    };
  }

  // Extract location-based features
  private extractLocationFeatures(location: unknown) {
    // In a real implementation, you would use:
    // - Geographic information systems (GIS)
    // - Population density data
    // - Traffic patterns
    // - Historical issue density
    
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      hasAddress: !!location.address,
      addressLength: location.address?.length || 0,
      isResidential: this.isResidentialArea(location),
      isCommercial: this.isCommercialArea(location),
      isHighTraffic: this.isHighTrafficArea(location)
    };
  }

  // Extract category-based features
  private extractCategoryFeatures(category: IssueCategory) {
    const categoryWeights = {
      'infrastructure': { urgency: 0.8, complexity: 0.7, cost: 0.9 },
      'sanitation': { urgency: 0.6, complexity: 0.4, cost: 0.3 },
      'safety': { urgency: 0.9, complexity: 0.8, cost: 0.7 },
      'transportation': { urgency: 0.7, complexity: 0.6, cost: 0.8 },
      'environment': { urgency: 0.5, complexity: 0.5, cost: 0.6 },
      'utilities': { urgency: 0.8, complexity: 0.7, cost: 0.8 },
      'other': { urgency: 0.4, complexity: 0.3, cost: 0.4 }
    };
    
    return categoryWeights[category] || categoryWeights.other;
  }

  // Extract historical features
  private extractHistoricalFeatures(historicalData: unknown) {
    const { similarIssues, departmentPerformance } = historicalData;
    
    return {
      similarIssueCount: similarIssues.length,
      averageResolutionTime: this.calculateAverageResolutionTime(similarIssues),
      successRate: this.calculateSuccessRate(similarIssues),
      departmentWorkload: this.calculateDepartmentWorkload(departmentPerformance),
      seasonalPattern: this.detectSeasonalPattern(similarIssues)
    };
  }

  // Extract time-based features
  private extractTimeFeatures(createdAt: Date) {
    const hour = createdAt.getHours();
    const dayOfWeek = createdAt.getDay();
    const month = createdAt.getMonth();
    
    return {
      hour,
      dayOfWeek,
      month,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isBusinessHours: hour >= 9 && hour <= 17,
      isNightTime: hour < 6 || hour > 22
    };
  }

  // Mock ML prediction (replace with real ML model)
  private async mockPredict(features: unknown) {
    // Simulate ML model prediction
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simple rule-based prediction for demo
    const urgencyScore = features.text.urgencyScore + features.category.urgency;
    const complexityScore = features.category.complexity;
    
    // Mock department scores
    const departmentScores = {
      'public-works': 0.8,
      'sanitation': 0.6,
      'safety': 0.9,
      'utilities': 0.7,
      'environment': 0.5
    };
    
    return {
      departmentScores,
      urgencyScore,
      complexityScore,
      estimatedResolutionTime: this.estimateResolutionTime(features),
      confidence: 0.85
    };
  }

  // Convert ML prediction to routing decision
  private convertPredictionToDecision(prediction: unknown, context: RoutingContext): RoutingDecision {
    const { departments } = context;
    
    // Find best department based on scores
    const bestDepartment = departments.reduce((best, dept) => {
      const score = prediction.departmentScores[dept.name.toLowerCase().replace(/\s+/g, '-')] || 0.5;
      return score > (prediction.departmentScores[best.name.toLowerCase().replace(/\s+/g, '-')] || 0.5) ? dept : best;
    }, departments[0]);
    
    // Determine priority based on urgency
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (prediction.urgencyScore > 0.8) priority = 'urgent';
    else if (prediction.urgencyScore > 0.6) priority = 'high';
    else if (prediction.urgencyScore < 0.3) priority = 'low';
    
    return {
      departmentId: bestDepartment.id,
      departmentName: bestDepartment.name,
      confidence: prediction.confidence,
      reasoning: this.generateReasoning(prediction, context),
      estimatedResolutionTime: prediction.estimatedResolutionTime,
      priority
    };
  }

  // Apply business rules to ML decision
  private async applyBusinessRules(decision: RoutingDecision, context: RoutingContext): Promise<RoutingDecision> {
    // Check department capacity
    const departmentWorkload = await this.getDepartmentWorkload(decision.departmentId);
    if (departmentWorkload > 0.9) {
      // Find alternative department
      const alternative = await this.findAlternativeDepartment(context, decision.departmentId);
      if (alternative) {
        decision.departmentId = alternative.id;
        decision.departmentName = alternative.name;
        decision.confidence *= 0.8; // Reduce confidence for alternative
        decision.reasoning.push('Primary department at capacity, assigned to alternative');
      }
    }
    
    // Check geographic constraints
    if (!this.isDepartmentResponsibleForArea(decision.departmentId, context.location)) {
      const geographicAlternative = await this.findGeographicAlternative(context);
      if (geographicAlternative) {
        decision.departmentId = geographicAlternative.id;
        decision.departmentName = geographicAlternative.name;
        decision.reasoning.push('Assigned based on geographic responsibility');
      }
    }
    
    // Check time constraints
    if (this.isAfterHours(context.issue.createdAt)) {
      decision.priority = 'urgent';
      decision.reasoning.push('After-hours issue, escalated priority');
    }
    
    return decision;
  }

  // Fallback routing when ML fails
  private async fallbackRouting(issue: Issue): Promise<RoutingDecision> {
    const categoryMapping: Record<IssueCategory, string> = {
      'infrastructure': 'Public Works',
      'sanitation': 'Sanitation Department',
      'safety': 'Public Safety',
      'transportation': 'Public Works',
      'environment': 'Environmental Services',
      'utilities': 'Utilities',
      'other': 'Public Works'
    };
    
    const departmentName = categoryMapping[issue.category];
    
    const { data: department } = await supabase
      .from('departments')
      .select('*')
      .eq('name', departmentName)
      .single();
    
    return {
      departmentId: department?.id || '',
      departmentName: departmentName,
      confidence: 0.6,
      reasoning: ['Fallback routing based on category mapping'],
      estimatedResolutionTime: 7, // days
      priority: 'medium'
    };
  }

  // Helper methods
  private isResidentialArea(location: unknown): boolean {
    // Mock implementation - in real app, use GIS data
    return Math.random() > 0.5;
  }

  private isCommercialArea(location: unknown): boolean {
    // Mock implementation
    return Math.random() > 0.7;
  }

  private isHighTrafficArea(location: unknown): boolean {
    // Mock implementation
    return Math.random() > 0.6;
  }

  private calculateAverageResolutionTime(issues: Issue[]): number {
    if (issues.length === 0) return 7;
    
    const resolvedIssues = issues.filter(issue => issue.resolvedAt);
    if (resolvedIssues.length === 0) return 7;
    
    const totalTime = resolvedIssues.reduce((sum, issue) => {
      const created = issue.createdAt.getTime();
      const resolved = issue.resolvedAt!.getTime();
      return sum + (resolved - created);
    }, 0);
    
    return totalTime / resolvedIssues.length / (1000 * 60 * 60 * 24); // days
  }

  private calculateSuccessRate(issues: Issue[]): number {
    if (issues.length === 0) return 0.8;
    
    const resolvedIssues = issues.filter(issue => issue.resolvedAt);
    return resolvedIssues.length / issues.length;
  }

  private calculateDepartmentWorkload(performance: React.ChangeEvent<HTMLInputElement>): number {
    // Mock implementation
    return Math.random() * 0.5 + 0.3; // 30-80% workload
  }

  private detectSeasonalPattern(issues: Issue[]): string {
    // Mock implementation
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    return seasons[Math.floor(Math.random() * seasons.length)];
  }

  private estimateResolutionTime(features: unknown): number {
    // Simple estimation based on features
    let baseTime = 5; // days
    
    if (features.category.urgency > 0.8) baseTime *= 0.5;
    if (features.category.complexity > 0.7) baseTime *= 1.5;
    if (features.text.urgencyScore > 2) baseTime *= 0.3;
    
    return Math.max(1, Math.min(30, baseTime));
  }

  private generateReasoning(prediction: unknown, context: RoutingContext): string[] {
    const reasoning = [];
    
    if (prediction.urgencyScore > 0.7) {
      reasoning.push('High urgency detected in issue description');
    }
    
    if (context.issue.category === 'safety') {
      reasoning.push('Safety-related issue requires immediate attention');
    }
    
    if (context.historicalData.similarIssues.length > 10) {
      reasoning.push('Similar issues have been reported in this area');
    }
    
    reasoning.push(`ML model confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    
    return reasoning;
  }

  private async getDepartmentWorkload(departmentId: string): Promise<number> {
    const { data: issues } = await supabase
      .from('issues')
      .select('id')
      .eq('department_id', departmentId)
      .in('status', ['pending', 'in-progress']);
    
    const { data: department } = await supabase
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .single();
    
    // Mock capacity calculation
    const capacity = 50; // Mock department capacity
    return (issues?.length || 0) / capacity;
  }

  private async getDepartmentPerformance(): Promise<Record<string, unknown>> {
    // Mock implementation
    return {
      'public-works': { averageResolutionTime: 5, successRate: 0.9, workload: 0.6 },
      'sanitation': { averageResolutionTime: 3, successRate: 0.95, workload: 0.4 },
      'safety': { averageResolutionTime: 2, successRate: 0.98, workload: 0.3 },
      'utilities': { averageResolutionTime: 4, successRate: 0.92, workload: 0.5 },
      'environment': { averageResolutionTime: 7, successRate: 0.85, workload: 0.2 }
    };
  }

  private isDepartmentResponsibleForArea(departmentId: string, location: unknown): boolean {
    // Mock implementation - in real app, check geographic boundaries
    return Math.random() > 0.2;
  }

  private async findAlternativeDepartment(context: RoutingContext, excludeId: string): Promise<Department | null> {
    const availableDepartments = context.departments.filter(dept => dept.id !== excludeId);
    return availableDepartments[0] || null;
  }

  private async findGeographicAlternative(context: RoutingContext): Promise<Department | null> {
    // Mock implementation
    return context.departments.find(dept => dept.name === 'Public Works') || null;
  }

  private isAfterHours(createdAt: Date): boolean {
    const hour = createdAt.getHours();
    return hour < 8 || hour > 18;
  }

  private async saveRoutingDecision(issueId: string, decision: RoutingDecision): Promise<void> {
    await supabase.from('routing_decisions').insert({
      issue_id: issueId,
      department_id: decision.departmentId,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      estimated_resolution_time: decision.estimatedResolutionTime,
      priority: decision.priority,
      created_at: new Date().toISOString()
    });
  }
}

export const mlRoutingService = new MLRoutingService();

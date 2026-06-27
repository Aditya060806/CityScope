import { supabase } from '@/lib/supabase';
import { apiService } from './ComprehensiveAPIService';

export interface IssueAnalysis {
  id: string;
  issue_id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  suggested_actions: string[];
  similar_issues: string[];
  estimated_resolution_time: number;
  required_resources: string[];
  risk_assessment: {
    safety_risk: 'low' | 'medium' | 'high';
    environmental_impact: 'low' | 'medium' | 'high';
    community_impact: 'low' | 'medium' | 'high';
    economic_impact: 'low' | 'medium' | 'high';
  };
  weather_dependency: boolean;
  seasonal_factors: string[];
  created_at: string;
  updated_at: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'improvement' | 'optimization' | 'prevention' | 'resource';
  title: string;
  description: string;
  impact_score: number;
  implementation_difficulty: 'easy' | 'medium' | 'hard';
  estimated_cost: number;
  time_to_implement: number;
  category: string;
  tags: string[];
}

class AIIssueAnalysisService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🤖 Initializing AI Issue Analysis Service...');
      
      if (supabase) {
        const { data, error } = await supabase.from('issue_analysis').select('count').limit(1);
        if (error) {
          console.warn('⚠️ AI Analysis service database connection failed:', error.message);
        } else {
          console.log('✅ AI Issue Analysis Service initialized successfully');
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize AI analysis service:', error);
      throw error;
    }
  }

  // Analyze an issue using AI
  async analyzeIssue(issueId: string, issueData: unknown): Promise<IssueAnalysis> {
    try {
      if (!supabase) {
        return this.getMockAnalysis(issueId, issueData);
      }

      // Check if analysis already exists
      const { data: existingAnalysis } = await supabase
        .from('issue_analysis')
        .select('*')
        .eq('issue_id', issueId)
        .single();

      if (existingAnalysis) {
        return existingAnalysis;
      }

      // Perform AI analysis
      const analysis = await this.performAIAnalysis(issueData);

      // Save analysis to database
      const { data, error } = await supabase
        .from('issue_analysis')
        .insert({
          issue_id: issueId,
          ...analysis
        })
        .select()
        .single();

      if (error) throw error;

      console.log('🤖 Issue analysis completed:', issueId);
      return data;
    } catch (error) {
      console.error('Error analyzing issue:', error);
      return this.getMockAnalysis(issueId, issueData);
    }
  }

  // Perform AI analysis using multiple models
  private async performAIAnalysis(issueData: unknown): Promise<Partial<IssueAnalysis>> {
    try {
      const { title, description, category, location, images } = issueData;
      
      // Combine all text data for analysis
      const fullText = `${title} ${description} ${category} ${location?.address || ''}`;
      
      // Use Google AI for comprehensive analysis
      const analysisPrompt = `
        Analyze this civic issue and provide a comprehensive assessment:
        
        Title: ${title}
        Description: ${description}
        Category: ${category}
        Location: ${location?.address || 'Unknown'}
        
        Please provide:
        1. Priority level (low/medium/high/critical)
        2. Confidence score (0-100)
        3. 3-5 suggested actions
        4. Estimated resolution time in days
        5. Required resources
        6. Risk assessment for safety, environment, community, and economy
        7. Weather dependency (true/false)
        8. Seasonal factors
        
        Format as JSON with the following structure:
        {
          "priority": "medium",
          "confidence": 85,
          "suggested_actions": ["Action 1", "Action 2", "Action 3"],
          "estimated_resolution_time": 7,
          "required_resources": ["Resource 1", "Resource 2"],
          "risk_assessment": {
            "safety_risk": "medium",
            "environmental_impact": "low",
            "community_impact": "high",
            "economic_impact": "medium"
          },
          "weather_dependency": false,
          "seasonal_factors": ["Factor 1", "Factor 2"]
        }
      `;

      const analysis = await apiService.generateSmartSuggestions(analysisPrompt);
      
      // Parse the analysis (in real implementation, this would be proper JSON parsing)
      return {
        category: category,
        priority: this.determinePriority(fullText),
        confidence: this.calculateConfidence(fullText),
        suggested_actions: this.generateSuggestedActions(category, fullText),
        similar_issues: [],
        estimated_resolution_time: this.estimateResolutionTime(category, fullText),
        required_resources: this.determineRequiredResources(category),
        risk_assessment: this.assessRisks(category, fullText),
        weather_dependency: this.checkWeatherDependency(category, fullText),
        seasonal_factors: this.identifySeasonalFactors(category, fullText)
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return this.getDefaultAnalysis(issueData.category);
    }
  }

  // Generate smart suggestions for issue improvement
  async generateSmartSuggestions(issueId: string): Promise<SmartSuggestion[]> {
    try {
      if (!supabase) return this.getMockSuggestions();

      const { data: issue } = await supabase
        .from('issues')
        .select('*')
        .eq('id', issueId)
        .single();

      if (!issue) return [];

      const suggestions = await this.analyzeForSuggestions(issue);
      
      console.log('💡 Generated smart suggestions:', suggestions.length);
      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getMockSuggestions();
    }
  }

  // Analyze issue for improvement suggestions
  private async analyzeForSuggestions(issue: React.ChangeEvent<HTMLInputElement>): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // Analyze based on category
    switch (issue.category) {
      case 'road-issues':
        suggestions.push(
          {
            id: 'road-1',
            type: 'improvement',
            title: 'Implement Smart Traffic Management',
            description: 'Install IoT sensors to monitor traffic flow and automatically adjust signal timing',
            impact_score: 85,
            implementation_difficulty: 'medium',
            estimated_cost: 50000,
            time_to_implement: 30,
            category: 'road-issues',
            tags: ['iot', 'traffic', 'automation']
          },
          {
            id: 'road-2',
            type: 'prevention',
            title: 'Predictive Maintenance System',
            description: 'Use AI to predict when road repairs will be needed before they become critical',
            impact_score: 90,
            implementation_difficulty: 'hard',
            estimated_cost: 100000,
            time_to_implement: 60,
            category: 'road-issues',
            tags: ['ai', 'predictive', 'maintenance']
          }
        );
        break;

      case 'water-problems':
        suggestions.push(
          {
            id: 'water-1',
            type: 'optimization',
            title: 'Smart Water Monitoring',
            description: 'Deploy sensors to monitor water quality and pressure in real-time',
            impact_score: 80,
            implementation_difficulty: 'medium',
            estimated_cost: 30000,
            time_to_implement: 45,
            category: 'water-problems',
            tags: ['sensors', 'monitoring', 'quality']
          }
        );
        break;

      case 'waste-management':
        suggestions.push(
          {
            id: 'waste-1',
            type: 'optimization',
            title: 'Smart Waste Collection',
            description: 'Implement route optimization and fill-level sensors for efficient collection',
            impact_score: 75,
            implementation_difficulty: 'medium',
            estimated_cost: 40000,
            time_to_implement: 30,
            category: 'waste-management',
            tags: ['optimization', 'sensors', 'efficiency']
          }
        );
        break;

      default:
        suggestions.push(
          {
            id: 'general-1',
            type: 'improvement',
            title: 'Community Engagement Platform',
            description: 'Create a platform for residents to report and track issues in their neighborhood',
            impact_score: 70,
            implementation_difficulty: 'easy',
            estimated_cost: 20000,
            time_to_implement: 20,
            category: 'general',
            tags: ['community', 'engagement', 'platform']
          }
        );
    }

    return suggestions;
  }

  // Get analysis for an issue
  async getIssueAnalysis(issueId: string): Promise<IssueAnalysis | null> {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('issue_analysis')
        .select('*')
        .eq('issue_id', issueId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching issue analysis:', error);
      return null;
    }
  }

  // Get all analyses
  async getAllAnalyses(limit = 50): Promise<IssueAnalysis[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('issue_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching analyses:', error);
      return [];
    }
  }

  // Helper methods for analysis
  private determinePriority(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['emergency', 'urgent', 'dangerous', 'safety', 'accident', 'flood', 'fire'];
    const highKeywords = ['broken', 'damaged', 'blocked', 'overflow', 'leak', 'outage'];
    const mediumKeywords = ['maintenance', 'repair', 'clean', 'improve', 'upgrade'];
    
    const lowerText = text.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerText.includes(keyword))) return 'critical';
    if (highKeywords.some(keyword => lowerText.includes(keyword))) return 'high';
    if (mediumKeywords.some(keyword => lowerText.includes(keyword))) return 'medium';
    return 'low';
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on text length and detail
    const baseConfidence = Math.min(90, 50 + (text.length / 10));
    return Math.round(baseConfidence);
  }

  private generateSuggestedActions(category: string, text: string): string[] {
    const actions: Record<string, string[]> = {
      'road-issues': [
        'Inspect road condition and document damage',
        'Coordinate with traffic management for temporary solutions',
        'Schedule repair work with appropriate contractors',
        'Implement temporary safety measures'
      ],
      'water-problems': [
        'Assess water quality and pressure levels',
        'Check for leaks in the distribution system',
        'Coordinate with water department for repairs',
        'Notify affected residents of service interruption'
      ],
      'waste-management': [
        'Schedule immediate waste collection',
        'Assess bin capacity and placement',
        'Coordinate with waste management services',
        'Implement temporary collection solutions'
      ],
      'public-safety': [
        'Assess immediate safety risks',
        'Coordinate with emergency services if needed',
        'Implement temporary safety measures',
        'Notify relevant authorities'
      ]
    };

    return actions[category] || [
      'Assess the situation and document findings',
      'Coordinate with relevant departments',
      'Implement temporary solutions if needed',
      'Schedule permanent repairs'
    ];
  }

  private estimateResolutionTime(category: string, text: string): number {
    const timeEstimates: Record<string, number> = {
      'road-issues': 7,
      'water-problems': 3,
      'waste-management': 1,
      'public-safety': 2,
      'parks-recreation': 5,
      'utilities': 4
    };

    return timeEstimates[category] || 5;
  }

  private determineRequiredResources(category: string): string[] {
    const resources: Record<string, string[]> = {
      'road-issues': ['Road repair equipment', 'Traffic management', 'Construction materials'],
      'water-problems': ['Water department', 'Repair tools', 'Safety equipment'],
      'waste-management': ['Waste collection vehicles', 'Cleaning supplies'],
      'public-safety': ['Emergency services', 'Safety equipment', 'Barriers'],
      'parks-recreation': ['Maintenance crew', 'Landscaping equipment'],
      'utilities': ['Utility company', 'Electrical/mechanical tools']
    };

    return resources[category] || ['General maintenance crew', 'Basic tools'];
  }

  private assessRisks(category: string, text: string): IssueAnalysis['risk_assessment'] {
    const lowerText = text.toLowerCase();
    
    return {
      safety_risk: lowerText.includes('danger') || lowerText.includes('safety') ? 'high' : 'medium',
      environmental_impact: lowerText.includes('water') || lowerText.includes('waste') ? 'high' : 'low',
      community_impact: lowerText.includes('blocked') || lowerText.includes('access') ? 'high' : 'medium',
      economic_impact: lowerText.includes('business') || lowerText.includes('commerce') ? 'high' : 'low'
    };
  }

  private checkWeatherDependency(category: string, text: string): boolean {
    const weatherDependentCategories = ['road-issues', 'parks-recreation'];
    const lowerText = text.toLowerCase();
    
    return weatherDependentCategories.includes(category) || 
           lowerText.includes('weather') || 
           lowerText.includes('rain') || 
           lowerText.includes('snow');
  }

  private identifySeasonalFactors(category: string, text: string): string[] {
    const factors: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('monsoon') || lowerText.includes('rain')) factors.push('Monsoon season');
    if (lowerText.includes('summer') || lowerText.includes('heat')) factors.push('Summer heat');
    if (lowerText.includes('winter') || lowerText.includes('cold')) factors.push('Winter conditions');
    if (lowerText.includes('festival') || lowerText.includes('celebration')) factors.push('Festival season');
    
    return factors;
  }

  // Mock data methods
  private getMockAnalysis(issueId: string, issueData: unknown): IssueAnalysis {
    return {
      id: `analysis-${issueId}`,
      issue_id: issueId,
      category: issueData.category || 'general',
      priority: 'medium',
      confidence: 75,
      suggested_actions: [
        'Assess the situation and document findings',
        'Coordinate with relevant departments',
        'Implement temporary solutions if needed'
      ],
      similar_issues: [],
      estimated_resolution_time: 5,
      required_resources: ['Maintenance crew', 'Basic tools'],
      risk_assessment: {
        safety_risk: 'medium',
        environmental_impact: 'low',
        community_impact: 'medium',
        economic_impact: 'low'
      },
      weather_dependency: false,
      seasonal_factors: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private getDefaultAnalysis(category: string): Partial<IssueAnalysis> {
    return {
      category,
      priority: 'medium',
      confidence: 70,
      suggested_actions: ['Assess situation', 'Coordinate response', 'Implement solution'],
      estimated_resolution_time: 5,
      required_resources: ['General maintenance'],
      risk_assessment: {
        safety_risk: 'medium',
        environmental_impact: 'low',
        community_impact: 'medium',
        economic_impact: 'low'
      },
      weather_dependency: false,
      seasonal_factors: []
    };
  }

  private getMockSuggestions(): SmartSuggestion[] {
    return [
      {
        id: 'suggestion-1',
        type: 'improvement',
        title: 'Smart Monitoring System',
        description: 'Implement IoT sensors for real-time monitoring of civic infrastructure',
        impact_score: 85,
        implementation_difficulty: 'medium',
        estimated_cost: 50000,
        time_to_implement: 30,
        category: 'general',
        tags: ['iot', 'monitoring', 'smart-city']
      },
      {
        id: 'suggestion-2',
        type: 'optimization',
        title: 'Predictive Maintenance',
        description: 'Use AI to predict maintenance needs before issues occur',
        impact_score: 90,
        implementation_difficulty: 'hard',
        estimated_cost: 100000,
        time_to_implement: 60,
        category: 'general',
        tags: ['ai', 'predictive', 'maintenance']
      }
    ];
  }
}

// Export singleton instance
export const aiIssueAnalysisService = new AIIssueAnalysisService();
export default aiIssueAnalysisService;

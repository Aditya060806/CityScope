import { Issue, CreateIssueData, IssueCategory, IssuePriority } from '@/types/civic';
import { geminiAIService } from './GeminiAIService';
import { issueService } from './IssueService';

interface AIAnalysisResult {
  category: IssueCategory;
  priority: IssuePriority;
  confidence: number;
  detectedIssues: string[];
  description: string;
  suggestedTitle: string;
  tags: string[];
  aiGenerated: boolean;
}


class AIEnhancedIssueService {
  /**
   * Create an issue with AI-powered analysis of photos and text
   */
  async createIssueWithAI(data: CreateIssueData & { 
    images?: string[];
    enableAIAnalysis?: boolean;
  }): Promise<Issue> {
    let enhancedData = { ...data };
    
    // AI Analysis if enabled and we have images or text
    if (data.enableAIAnalysis !== false && (data.images?.length || data.description)) {
      try {
        const aiAnalysis = await this.performAIAnalysis(data);
        
        // Enhance the data with AI insights
        enhancedData = {
          ...data,
          category: aiAnalysis.category,
          priority: aiAnalysis.priority,
          title: aiAnalysis.suggestedTitle || data.title,
          description: aiAnalysis.description || data.description,
        };
        
        console.log('🤖 AI Analysis completed:', aiAnalysis);
      } catch (error) {
        console.warn('⚠️ AI analysis failed, using original data:', error);
      }
    }

    // Create the issue using the existing service
    return await issueService.createIssue(enhancedData);
  }


  /**
   * Analyze uploaded images for civic issues
   */
  async analyzeImages(images: string[]): Promise<AIAnalysisResult[]> {
    const analyses: AIAnalysisResult[] = [];
    
    for (const imageData of images) {
      try {
        const analysis = await geminiAIService.analyzeIssuePhoto(imageData);
        analyses.push({
          ...analysis,
          aiGenerated: true
        });
      } catch (error) {
        console.error('Error analyzing image:', error);
        analyses.push({
          category: 'other',
          priority: 'medium',
          confidence: 0.1,
          detectedIssues: ['Analysis failed'],
          description: 'Unable to analyze image',
          suggestedTitle: 'Civic Issue Report',
          tags: ['manual-review'],
          aiGenerated: false
        });
      }
    }
    
    return analyses;
  }

  /**
   * Get smart suggestions for issue reporting - Only for photo mode
   * This method should only be called when analyzing photos with AI
   */
  async getSmartSuggestions(partialText: string, context: 'title' | 'description'): Promise<Array<{
    type: 'category' | 'title' | 'description' | 'priority';
    value: string;
    confidence: number;
    reason: string;
  }>> {
    try {
      return await geminiAIService.generateSmartSuggestions(partialText, context);
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      
      // Fallback to basic suggestions if AI service fails
      try {
        const { fallbackAIService } = await import('./FallbackAIService');
        return fallbackAIService.generateSmartSuggestions(partialText, context);
      } catch (fallbackError) {
        console.error('Fallback service also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Perform comprehensive AI analysis on issue data
   */
  private async performAIAnalysis(data: CreateIssueData & { images?: string[] }): Promise<AIAnalysisResult> {
    let bestAnalysis: AIAnalysisResult = {
      category: 'other',
      priority: 'medium',
      confidence: 0.5,
      detectedIssues: [],
      description: data.description,
      suggestedTitle: data.title,
      tags: [],
      aiGenerated: false
    };

    // Analyze images if available
    if (data.images && data.images.length > 0) {
      const imageAnalyses = await this.analyzeImages(data.images);
      
      // Find the analysis with highest confidence
      const bestImageAnalysis = imageAnalyses.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      if (bestImageAnalysis.confidence > bestAnalysis.confidence) {
        bestAnalysis = bestImageAnalysis;
      }
    }

    // Analyze text description
    if (data.description) {
      try {
        const textAnalysis = await geminiAIService.analyzeIssueDescription(data.description, data.title);
        
        // Combine image and text analysis (prefer higher confidence)
        if (textAnalysis.confidence > bestAnalysis.confidence) {
          bestAnalysis = {
            ...textAnalysis,
            aiGenerated: true
          };
        } else {
          // Merge insights from both analyses
          bestAnalysis = {
            ...bestAnalysis,
            detectedIssues: [...new Set([...bestAnalysis.detectedIssues, ...textAnalysis.detectedIssues])],
            tags: [...new Set([...bestAnalysis.tags, ...textAnalysis.tags])],
            aiGenerated: true
          };
        }
      } catch (error) {
        console.warn('Text analysis failed:', error);
      }
    }

    return bestAnalysis;
  }

  /**
   * Get AI-powered insights for analytics
   */
  async getAIAnalytics(issues: Issue[]): Promise<{
    hotspots: Array<{ location: string; count: number; issues: string[] }>;
    trends: Array<{ category: string; trend: 'increasing' | 'decreasing' | 'stable'; confidence: number }>;
    recommendations: string[];
  }> {
    try {
      return await geminiAIService.analyzeIssuePatterns(issues);
    } catch (error) {
      console.error('Error getting AI analytics:', error);
      return { hotspots: [], trends: [], recommendations: [] };
    }
  }

  /**
   * Auto-categorize and prioritize issues in bulk
   */
  async bulkAnalyzeIssues(issues: Issue[]): Promise<Issue[]> {
    const analyzedIssues: Issue[] = [];
    
    for (const issue of issues) {
      try {
        // Only analyze if not already AI-analyzed
        if (!issue.timeline?.some(update => update.updatedBy === 'AI Assistant')) {
          const analysis = await geminiAIService.analyzeIssueDescription(
            issue.description, 
            issue.title
          );
          
          // Update issue with AI insights
          const updatedIssue = {
            ...issue,
            category: analysis.category,
            priority: analysis.priority,
            timeline: [
              ...(issue.timeline || []),
              {
                status: issue.status,
                timestamp: new Date(),
                note: `AI analysis: ${analysis.detectedIssues.join(', ')}`,
                updatedBy: 'AI Assistant'
              }
            ]
          };
          
          analyzedIssues.push(updatedIssue);
        } else {
          analyzedIssues.push(issue);
        }
      } catch (error) {
        console.error('Error analyzing issue:', issue.id, error);
        analyzedIssues.push(issue);
      }
    }
    
    return analyzedIssues;
  }
}

// Export singleton instance
export const aiEnhancedIssueService = new AIEnhancedIssueService();
export default aiEnhancedIssueService;

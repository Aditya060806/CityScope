import { Issue, IssueCategory, SmartSuggestion } from '@/types/civic';

interface MLModelConfig {
  modelId: string;
  version: string;
  endpoint: string;
  apiKey: string;
  confidenceThreshold: number;
}

interface ImageAnalysisResult {
  category: IssueCategory;
  confidence: number;
  tags: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  location: {
    lat?: number;
    lng?: number;
    address?: string;
  };
}

interface TextAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  keywords: string[];
  category: IssueCategory;
  confidence: number;
}

interface RoutingRecommendation {
  departmentId: string;
  departmentName: string;
  confidence: number;
  reasoning: string;
  estimatedResolutionTime: number; // in hours
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class RealMLService {
  private googleVisionApiKey: string;
  private openaiApiKey: string;
  private customMLApiKey: string;
  private isInitialized = false;

  constructor() {
    this.googleVisionApiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY || '';
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.customMLApiKey = import.meta.env.VITE_CUSTOM_ML_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test API connectivity
      await this.testAPIConnectivity();
      this.isInitialized = true;
      console.log('Real ML Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Real ML Service:', error);
      this.isInitialized = true; // Allow fallback to work
    }
  }

  private async testAPIConnectivity(): Promise<void> {
    // Test Google Vision API
    if (this.googleVisionApiKey) {
      await this.testGoogleVisionAPI();
    }

    // Test OpenAI API
    if (this.openaiApiKey) {
      await this.testOpenAIAPI();
    }
  }

  private async testGoogleVisionAPI(): Promise<void> {
    // Simple test request to Google Vision API
    const testImage = new Blob(['test'], { type: 'image/jpeg' });
    await this.analyzeImageWithGoogleVision(testImage);
  }

  private async testOpenAIAPI(): Promise<void> {
    // Simple test request to OpenAI API
    await this.analyzeTextWithOpenAI('Test civic issue description');
  }

  // Analyze image for issue categorization
  async analyzeImageForCategory(imageFile: File): Promise<SmartSuggestion> {
    await this.initialize();

    try {
      if (this.googleVisionApiKey) {
        return await this.analyzeImageWithGoogleVision(imageFile);
      } else {
        return await this.analyzeImageWithFallback(imageFile);
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      return await this.analyzeImageWithFallback(imageFile);
    }
  }

  private async analyzeImageWithGoogleVision(imageFile: File): Promise<SmartSuggestion> {
    const base64Image = await this.fileToBase64(imageFile);
    
    const requestBody = {
      requests: [{
        image: {
          content: base64Image
        },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'TEXT_DETECTION', maxResults: 5 },
          { type: 'SAFE_SEARCH_DETECTION' }
        ]
      }]
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.statusText}`);
    }

    const result = await response.json();
    return this.parseGoogleVisionResult(result);
  }

  private parseGoogleVisionResult(result: unknown): SmartSuggestion {
    const annotations = result.responses[0];
    const labels = annotations.labelAnnotations || [];
    const objects = annotations.localizedObjectAnnotations || [];
    const textAnnotations = annotations.textAnnotations || [];

    // Combine all detected elements
    const allElements = [
      ...labels.map((l: unknown) => ({ text: l.description, score: l.score })),
      ...objects.map((o: unknown) => ({ text: o.name, score: o.score })),
      ...textAnnotations.slice(1).map((t: unknown) => ({ text: t.description, score: 0.8 }))
    ];

    // Categorize based on detected elements
    const category = this.categorizeFromElements(allElements);
    const confidence = this.calculateConfidence(allElements, category);
    const reason = this.generateReasoning(allElements, category);

    return {
      category,
      confidence,
      reason
    };
  }

  private categorizeFromElements(elements: Array<{ text: string; score: number }>): IssueCategory {
    const text = elements.map(e => e.text.toLowerCase()).join(' ');
    
    // Road and infrastructure issues
    if (text.includes('pothole') || text.includes('road') || text.includes('asphalt') || 
        text.includes('crack') || text.includes('pavement') || text.includes('street')) {
      return 'roads';
    }

    // Lighting issues
    if (text.includes('light') || text.includes('lamp') || text.includes('streetlight') || 
        text.includes('bulb') || text.includes('electrical') || text.includes('power')) {
      return 'lighting';
    }

    // Water issues
    if (text.includes('water') || text.includes('leak') || text.includes('pipe') || 
        text.includes('drain') || text.includes('flood') || text.includes('sewer')) {
      return 'water';
    }

    // Sanitation issues
    if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || 
        text.includes('litter') || text.includes('dumpster') || text.includes('bin')) {
      return 'sanitation';
    }

    // Traffic issues
    if (text.includes('traffic') || text.includes('signal') || text.includes('sign') || 
        text.includes('parking') || text.includes('vehicle') || text.includes('accident')) {
      return 'traffic';
    }

    // Parks and recreation
    if (text.includes('park') || text.includes('tree') || text.includes('playground') || 
        text.includes('bench') || text.includes('grass') || text.includes('garden')) {
      return 'parks';
    }

    return 'other';
  }

  private calculateConfidence(elements: Array<{ text: string; score: number }>, category: IssueCategory): number {
    const relevantElements = elements.filter(e => 
      this.isRelevantToCategory(e.text, category)
    );

    if (relevantElements.length === 0) return 0.3;

    const avgScore = relevantElements.reduce((sum, e) => sum + e.score, 0) / relevantElements.length;
    return Math.min(avgScore, 0.95);
  }

  private isRelevantToCategory(text: string, category: IssueCategory): boolean {
    const categoryKeywords = {
      roads: ['pothole', 'road', 'asphalt', 'crack', 'pavement', 'street'],
      lighting: ['light', 'lamp', 'streetlight', 'bulb', 'electrical', 'power'],
      water: ['water', 'leak', 'pipe', 'drain', 'flood', 'sewer'],
      sanitation: ['garbage', 'trash', 'waste', 'litter', 'dumpster', 'bin'],
      traffic: ['traffic', 'signal', 'sign', 'parking', 'vehicle', 'accident'],
      parks: ['park', 'tree', 'playground', 'bench', 'grass', 'garden']
    };

    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private generateReasoning(elements: Array<{ text: string; score: number }>, category: IssueCategory): string {
    const relevantElements = elements.filter(e => 
      this.isRelevantToCategory(e.text, category)
    );

    if (relevantElements.length === 0) {
      return 'No specific indicators detected, classified as general issue';
    }

    const topElements = relevantElements
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(e => e.text);

    return `Detected ${topElements.join(', ')} indicating ${category} issue`;
  }

  private async analyzeImageWithFallback(imageFile: File): Promise<SmartSuggestion> {
    // Fallback to basic file name analysis
    const fileName = imageFile.name.toLowerCase();
    
    if (fileName.includes('pothole') || fileName.includes('road')) {
      return {
        category: 'roads',
        confidence: 0.7,
        reason: 'File name suggests road-related issue'
      };
    }
    
    if (fileName.includes('light') || fileName.includes('lamp')) {
      return {
        category: 'lighting',
        confidence: 0.7,
        reason: 'File name suggests lighting issue'
      };
    }

    // Default fallback
    return {
      category: 'other',
      confidence: 0.3,
      reason: 'Unable to analyze image, using default category'
    };
  }

  // Analyze text for sentiment and urgency
  async analyzeTextForSentiment(text: string): Promise<TextAnalysisResult> {
    await this.initialize();

    try {
      if (this.openaiApiKey) {
        return await this.analyzeTextWithOpenAI(text);
      } else {
        return await this.analyzeTextWithFallback(text);
      }
    } catch (error) {
      console.error('Text analysis failed:', error);
      return await this.analyzeTextWithFallback(text);
    }
  }

  private async analyzeTextWithOpenAI(text: string): Promise<TextAnalysisResult> {
    const prompt = `Analyze this civic issue description and provide:
1. Sentiment (positive, neutral, negative)
2. Urgency level (low, medium, high, urgent)
3. Key keywords
4. Most likely category (roads, lighting, water, sanitation, traffic, parks, other)
5. Confidence score (0-1)

Text: "${text}"

Respond in JSON format: {
  "sentiment": "negative",
  "urgency": "high",
  "keywords": ["pothole", "dangerous", "accident"],
  "category": "roads",
  "confidence": 0.85
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      throw new Error('Failed to parse OpenAI response');
    }
  }

  private analyzeTextWithFallback(text: string): TextAnalysisResult {
    const lowerText = text.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'fixed', 'resolved', 'thank'];
    const negativeWords = ['bad', 'terrible', 'awful', 'dangerous', 'urgent', 'emergency', 'broken'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    // Simple urgency analysis
    const urgentWords = ['urgent', 'emergency', 'dangerous', 'immediate', 'critical', 'asap'];
    const hasUrgentWords = urgentWords.some(word => lowerText.includes(word));
    
    let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (hasUrgentWords) urgency = 'urgent';
    else if (negativeCount > 2) urgency = 'high';
    else if (negativeCount > 0) urgency = 'medium';

    // Extract keywords
    const keywords = text.split(' ')
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
      .filter(word => word.length > 0)
      .slice(0, 5);

    // Simple category detection
    const category = this.categorizeFromText(lowerText);

    return {
      sentiment,
      urgency,
      keywords,
      category,
      confidence: 0.6
    };
  }

  private categorizeFromText(text: string): IssueCategory {
    if (text.includes('pothole') || text.includes('road') || text.includes('street')) return 'roads';
    if (text.includes('light') || text.includes('lamp') || text.includes('dark')) return 'lighting';
    if (text.includes('water') || text.includes('leak') || text.includes('drain')) return 'water';
    if (text.includes('garbage') || text.includes('trash') || text.includes('waste')) return 'sanitation';
    if (text.includes('traffic') || text.includes('signal') || text.includes('parking')) return 'traffic';
    if (text.includes('park') || text.includes('tree') || text.includes('playground')) return 'parks';
    return 'other';
  }

  // Get routing recommendation
  async getRoutingRecommendation(issue: Issue): Promise<RoutingRecommendation> {
    await this.initialize();

    try {
      // Combine image and text analysis
      const textAnalysis = await this.analyzeTextForSentiment(issue.description);
      
      // Get department mapping
      const departmentMapping = this.getDepartmentMapping();
      const recommendedDept = departmentMapping[issue.category] || departmentMapping['other'];
      
      // Calculate estimated resolution time based on category and urgency
      const baseTime = this.getBaseResolutionTime(issue.category);
      const urgencyMultiplier = this.getUrgencyMultiplier(textAnalysis.urgency);
      const estimatedTime = Math.round(baseTime * urgencyMultiplier);

      return {
        departmentId: recommendedDept.id,
        departmentName: recommendedDept.name,
        confidence: textAnalysis.confidence,
        reasoning: `Category: ${issue.category}, Urgency: ${textAnalysis.urgency}, Sentiment: ${textAnalysis.sentiment}`,
        estimatedResolutionTime: estimatedTime,
        priority: textAnalysis.urgency
      };
    } catch (error) {
      console.error('Routing recommendation failed:', error);
      return this.getFallbackRouting(issue);
    }
  }

  private getDepartmentMapping(): Record<string, { id: string | null; name: string }> {
    return {
      roads: { id: null, name: 'Public Works' },
      lighting: { id: null, name: 'Utilities' },
      water: { id: null, name: 'Utilities' },
      sanitation: { id: null, name: 'Sanitation Department' },
      traffic: { id: null, name: 'Public Safety' },
      parks: { id: null, name: 'Environmental Services' },
      other: { id: null, name: 'Public Works' }
    };
  }

  private getBaseResolutionTime(category: IssueCategory): number {
    const baseTimes = {
      roads: 48, // 2 days
      lighting: 24, // 1 day
      water: 12, // 12 hours
      sanitation: 6, // 6 hours
      traffic: 4, // 4 hours
      parks: 72, // 3 days
      other: 24 // 1 day
    };
    return baseTimes[category] || 24;
  }

  private getUrgencyMultiplier(urgency: string): number {
    const multipliers = {
      low: 1.5,
      medium: 1.0,
      high: 0.7,
      urgent: 0.3
    };
    return multipliers[urgency as keyof typeof multipliers] || 1.0;
  }

  private getFallbackRouting(issue: Issue): RoutingRecommendation {
    const departmentMapping = this.getDepartmentMapping();
    const recommendedDept = departmentMapping[issue.category] || departmentMapping['other'];
    
    return {
      departmentId: recommendedDept.id,
      departmentName: recommendedDept.name,
      confidence: 0.5,
      reasoning: 'Fallback routing based on category only',
      estimatedResolutionTime: this.getBaseResolutionTime(issue.category),
      priority: 'medium'
    };
  }

  // Utility function to convert file to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Get service status
  getServiceStatus(): {
    googleVision: boolean;
    openai: boolean;
    customML: boolean;
    isFullyOperational: boolean;
  } {
    return {
      googleVision: !!this.googleVisionApiKey,
      openai: !!this.openaiApiKey,
      customML: !!this.customMLApiKey,
      isFullyOperational: !!(this.googleVisionApiKey && this.openaiApiKey)
    };
  }
}

export const realMLService = new RealMLService();

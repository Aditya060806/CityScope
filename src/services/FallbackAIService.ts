import { IssueCategory, IssuePriority } from '@/types/civic';

/**
 * Fallback AI service that provides basic categorization when Gemini API is unavailable
 */
class FallbackAIService {
  /**
   * Basic text-based categorization using keyword matching
   */
  analyzeIssueDescription(description: string, title?: string): {
    category: IssueCategory;
    priority: IssuePriority;
    confidence: number;
    detectedIssues: string[];
    description: string;
    suggestedTitle: string;
    tags: string[];
  } {
    const text = `${title || ''} ${description}`.toLowerCase();
    
    // Category detection based on keywords
    let category: IssueCategory = 'other';
    let confidence = 0.3;
    const detectedIssues: string[] = [];
    const tags: string[] = [];

    // Roads and infrastructure
    if (this.containsKeywords(text, ['pothole', 'road', 'street', 'pavement', 'asphalt', 'crack', 'bump'])) {
      category = 'roads';
      confidence = 0.7;
      detectedIssues.push('Road infrastructure issue');
      tags.push('infrastructure', 'transportation');
    }
    // Lighting
    else if (this.containsKeywords(text, ['light', 'lamp', 'streetlight', 'dark', 'bulb', 'electrical'])) {
      category = 'lighting';
      confidence = 0.7;
      detectedIssues.push('Lighting issue');
      tags.push('lighting', 'safety');
    }
    // Water
    else if (this.containsKeywords(text, ['water', 'leak', 'pipe', 'drain', 'flood', 'sewer', 'plumbing'])) {
      category = 'water';
      confidence = 0.7;
      detectedIssues.push('Water system issue');
      tags.push('water', 'infrastructure');
    }
    // Sanitation
    else if (this.containsKeywords(text, ['garbage', 'trash', 'waste', 'litter', 'bin', 'dumpster', 'dirty'])) {
      category = 'sanitation';
      confidence = 0.7;
      detectedIssues.push('Sanitation issue');
      tags.push('sanitation', 'cleanliness');
    }
    // Traffic
    else if (this.containsKeywords(text, ['traffic', 'signal', 'sign', 'parking', 'vehicle', 'car', 'accident'])) {
      category = 'traffic';
      confidence = 0.7;
      detectedIssues.push('Traffic issue');
      tags.push('traffic', 'safety');
    }
    // Parks
    else if (this.containsKeywords(text, ['park', 'tree', 'playground', 'bench', 'grass', 'garden', 'recreation'])) {
      category = 'parks';
      confidence = 0.7;
      detectedIssues.push('Parks and recreation issue');
      tags.push('parks', 'recreation');
    }

    // Priority detection based on urgency keywords
    let priority: IssuePriority = 'medium';
    if (this.containsKeywords(text, ['urgent', 'emergency', 'dangerous', 'critical', 'immediate', 'asap'])) {
      priority = 'urgent';
    } else if (this.containsKeywords(text, ['important', 'serious', 'major', 'significant'])) {
      priority = 'high';
    } else if (this.containsKeywords(text, ['minor', 'small', 'cosmetic', 'aesthetic'])) {
      priority = 'low';
    }

    // Generate suggested title if not provided
    const suggestedTitle = title || this.generateTitle(category, detectedIssues[0] || 'Civic Issue');

    return {
      category,
      priority,
      confidence,
      detectedIssues,
      description: description || 'Issue reported by citizen',
      suggestedTitle,
      tags
    };
  }

  /**
   * Basic image analysis fallback (filename-based)
   */
  analyzeIssuePhoto(imageFile: File): {
    category: IssueCategory;
    priority: IssuePriority;
    confidence: number;
    detectedIssues: string[];
    description: string;
    suggestedTitle: string;
    tags: string[];
  } {
    const fileName = imageFile.name.toLowerCase();
    
    // Try to categorize based on filename
    if (this.containsKeywords(fileName, ['pothole', 'road', 'street'])) {
      return {
        category: 'roads',
        priority: 'medium',
        confidence: 0.5,
        detectedIssues: ['Road issue detected from filename'],
        description: 'Possible road infrastructure issue based on image filename',
        suggestedTitle: 'Road Infrastructure Issue',
        tags: ['roads', 'infrastructure']
      };
    }

    if (this.containsKeywords(fileName, ['light', 'lamp', 'streetlight'])) {
      return {
        category: 'lighting',
        priority: 'medium',
        confidence: 0.5,
        detectedIssues: ['Lighting issue detected from filename'],
        description: 'Possible lighting issue based on image filename',
        suggestedTitle: 'Lighting Issue',
        tags: ['lighting', 'safety']
      };
    }

    // Default fallback
    return {
      category: 'other',
      priority: 'medium',
      confidence: 0.2,
      detectedIssues: ['Issue detected in uploaded image'],
      description: 'Civic issue reported with photo attachment',
      suggestedTitle: 'Civic Issue Report',
      tags: ['photo-report']
    };
  }

  /**
   * Generate smart suggestions based on partial text
   */
  generateSmartSuggestions(partialText: string, context: 'title' | 'description'): Array<{
    type: 'category' | 'title' | 'description' | 'priority';
    value: string;
    confidence: number;
    reason: string;
  }> {
    const suggestions = [];
    const text = partialText.toLowerCase();

    if (context === 'title') {
      // Title suggestions
      if (text.includes('pothole')) {
        suggestions.push({
          type: 'title' as const,
          value: 'Large Pothole Needs Repair',
          confidence: 0.8,
          reason: 'Common pothole report format'
        });
      }
      if (text.includes('light')) {
        suggestions.push({
          type: 'title' as const,
          value: 'Broken Streetlight Repair Needed',
          confidence: 0.8,
          reason: 'Common lighting issue format'
        });
      }
    } else {
      // Description suggestions
      if (text.includes('pothole')) {
        suggestions.push({
          type: 'description' as const,
          value: 'There is a pothole that needs immediate attention as it poses a safety hazard to vehicles and pedestrians.',
          confidence: 0.7,
          reason: 'Standard pothole description template'
        });
      }
    }

    // Category suggestions
    const analysis = this.analyzeIssueDescription(partialText);
    if (analysis.confidence > 0.5) {
      suggestions.push({
        type: 'category' as const,
        value: analysis.category,
        confidence: analysis.confidence,
        reason: `Detected ${analysis.category} issue based on keywords`
      });
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private generateTitle(category: IssueCategory, issue: string): string {
    const categoryTitles = {
      roads: 'Road Infrastructure Issue',
      lighting: 'Street Lighting Problem',
      water: 'Water System Issue',
      sanitation: 'Sanitation Problem',
      traffic: 'Traffic Safety Issue',
      parks: 'Parks and Recreation Issue',
      other: 'Civic Issue Report'
    };

    return categoryTitles[category] || 'Civic Issue Report';
  }
}

export const fallbackAIService = new FallbackAIService();
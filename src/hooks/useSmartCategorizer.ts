import { useState, useEffect } from 'react';
import { IssueCategory, SmartSuggestion } from '@/types/civic';

export const useSmartCategorizer = () => {
  const [suggestion, setSuggestion] = useState<SmartSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCategoryFromText = async (text: string): Promise<SmartSuggestion | null> => {
    if (!text || text.length < 10) return null;

    setIsAnalyzing(true);
    
    try {
      // Simple keyword-based categorization for local development
      const keywords = {
        roads: ['pothole', 'road', 'street', 'pavement', 'crack', 'asphalt'],
        lighting: ['light', 'lamp', 'dark', 'bulb', 'electricity', 'power'],
        sanitation: ['garbage', 'trash', 'waste', 'dirty', 'clean', 'bin'],
        water: ['water', 'leak', 'pipe', 'drain', 'flood', 'supply'],
        traffic: ['traffic', 'signal', 'sign', 'parking', 'vehicle', 'car'],
        parks: ['park', 'tree', 'garden', 'playground', 'bench', 'grass'],
        other: []
      };

      const textLower = text.toLowerCase();
      let bestMatch: { category: IssueCategory; score: number } = { category: 'other', score: 0 };

      for (const [category, words] of Object.entries(keywords)) {
        if (category === 'other') continue;
        
        const matches = words.filter(word => textLower.includes(word)).length;
        const score = matches / words.length;
        
        if (score > bestMatch.score) {
          bestMatch = { category: category as IssueCategory, score };
        }
      }

      if (bestMatch.score > 0.1) {
        const suggestion: SmartSuggestion = {
          category: bestMatch.category,
          confidence: Math.min(bestMatch.score * 100, 95),
          reason: `Detected keywords related to ${bestMatch.category}`
        };
        
        setSuggestion(suggestion);
        return suggestion;
      }
      
      return null;
    } catch (error) {
      console.error('Smart categorization failed:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    suggestion,
    isAnalyzing,
    analyzeCategoryFromText,
    clearSuggestion: () => setSuggestion(null)
  };
};
import { useState, useCallback } from 'react';
import { SmartSuggestion, IssueCategory } from '@/types/civic';

// Mock AI categorization - in real app would use image recognition API
const analyzeImage = async (imageFile: File): Promise<SmartSuggestion | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock analysis based on file name or random selection
  const fileName = imageFile.name.toLowerCase();
  
  if (fileName.includes('pothole') || fileName.includes('road')) {
    return {
      category: 'roads',
      confidence: 0.85,
      reason: 'Detected road surface damage and asphalt patterns'
    };
  }
  
  if (fileName.includes('light') || fileName.includes('lamp')) {
    return {
      category: 'lighting',
      confidence: 0.78,
      reason: 'Identified street lighting fixture and electrical components'
    };
  }
  
  if (fileName.includes('water') || fileName.includes('leak')) {
    return {
      category: 'water',
      confidence: 0.92,
      reason: 'Water flow patterns and moisture detected'
    };
  }
  
  if (fileName.includes('garbage') || fileName.includes('trash')) {
    return {
      category: 'cleanliness',
      confidence: 0.88,
      reason: 'Waste accumulation and sanitation issues identified'
    };
  }
  
  // Random suggestion for demo purposes
  const categories: IssueCategory[] = ['roads', 'lighting', 'water', 'cleanliness', 'safety', 'obstructions'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const confidence = 0.6 + Math.random() * 0.3; // 60-90%
  
  const reasons = {
    roads: 'Detected potential road surface irregularities',
    lighting: 'Possible lighting infrastructure in image',
    water: 'Water or moisture patterns identified',
    cleanliness: 'Potential waste or cleanliness issues detected',
    safety: 'Safety-related elements identified in scene',
    obstructions: 'Objects that may obstruct pathways detected'
  };
  
  return {
    category: randomCategory,
    confidence,
    reason: reasons[randomCategory]
  };
};

export const useSmartCategorizer = () => {
  const [suggestion, setSuggestion] = useState<SmartSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const analyzeImageForCategory = useCallback(async (imageFile: File) => {
    setIsAnalyzing(true);
    setSuggestion(null);
    setIsVisible(false);
    
    try {
      const result = await analyzeImage(imageFile);
      if (result) {
        setSuggestion(result);
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const acceptSuggestion = useCallback(() => {
    setIsVisible(false);
    return suggestion;
  }, [suggestion]);

  const rejectSuggestion = useCallback(() => {
    setIsVisible(false);
    setSuggestion(null);
  }, []);

  const resetSuggestion = useCallback(() => {
    setSuggestion(null);
    setIsVisible(false);
    setIsAnalyzing(false);
  }, []);

  return {
    suggestion,
    isAnalyzing,
    isVisible,
    analyzeImageForCategory,
    acceptSuggestion,
    rejectSuggestion,
    resetSuggestion
  };
};
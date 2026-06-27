import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Sparkles, 
  Check, 
  X, 
  Loader2,
  Target,
  Zap,
  Brain,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiEnhancedIssueService } from '@/services/AIEnhancedIssueService';
import { IssueCategory, CATEGORY_CONFIG } from '@/types/civic';
import { toast } from 'sonner';

interface SmartSuggestion {
  type: 'category' | 'title' | 'description' | 'priority';
  value: string;
  confidence: number;
  reason: string;
}

interface AISmartSuggestionsProps {
  partialText: string;
  context: 'title' | 'description';
  onSuggestionSelect: (suggestion: SmartSuggestion) => void;
  className?: string;
  disabled?: boolean;
  mode?: 'photo' | 'manual'; // Add mode prop to control when AI suggestions appear
}

export const AISmartSuggestions: React.FC<AISmartSuggestionsProps> = ({
  partialText,
  context,
  onSuggestionSelect,
  className,
  disabled = false,
  mode = 'photo'
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [debouncedText, setDebouncedText] = useState(partialText);

  // Debounce the text input to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(partialText);
    }, 500);

    return () => clearTimeout(timer);
  }, [partialText]);

  const fetchSuggestions = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      const newSuggestions = await aiEnhancedIssueService.getSmartSuggestions(text, context);
      
      // Validate suggestions before setting them
      if (Array.isArray(newSuggestions)) {
        const validSuggestions = newSuggestions.filter(suggestion => 
          suggestion && 
          typeof suggestion === 'object' && 
          suggestion.type && 
          suggestion.value && 
          typeof suggestion.confidence === 'number'
        );
        setSuggestions(validSuggestions);
      } else {
        console.warn('Invalid suggestions format received:', newSuggestions);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Don't show error toast for AI suggestions - just silently fail
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Fetch suggestions when text changes - only in photo mode
  useEffect(() => {
    if (debouncedText.length > 3 && !disabled && mode === 'photo') {
      fetchSuggestions(debouncedText);
    } else {
      setSuggestions([]);
    }
  }, [debouncedText, context, disabled, mode, fetchSuggestions]);

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    setSelectedSuggestion(suggestion.value);
    onSuggestionSelect(suggestion);
    toast.success('Suggestion applied');
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'category':
        return <Target className="w-4 h-4" />;
      case 'title':
        return <Zap className="w-4 h-4" />;
      case 'description':
        return <Brain className="w-4 h-4" />;
      case 'priority':
        return <ArrowRight className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'category':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'title':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'description':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'priority':
        return 'text-orange-600 bg-orange-50 border-orange-200';
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

  if (disabled || suggestions.length === 0 || mode !== 'photo') {
    return null;
  }

  return (
    <Card className={cn('card-sleek', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-royal" />
              <span className="text-sm font-semibold text-gray-700">AI Suggestions</span>
              <Badge variant="outline" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                Smart
              </Badge>
            </div>
            
            {isLoading && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Suggestions List */}
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedSuggestion === suggestion.value
                    ? "ring-2 ring-royal ring-opacity-50 bg-royal/5"
                    : "hover:bg-gray-50",
                  getSuggestionColor(suggestion.type)
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs capitalize"
                        >
                          {suggestion.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs', getConfidenceColor(suggestion.confidence))}
                        >
                          {getConfidenceLabel(suggestion.confidence)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {suggestion.value}
                      </p>
                      
                      <p className="text-xs text-gray-600">
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {selectedSuggestion === suggestion.value ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category-specific suggestions */}
          {context === 'description' && suggestions.some(s => s.type === 'category') && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Quick category selection:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleSuggestionClick({
                      type: 'category',
                      value: key,
                      confidence: 0.8,
                      reason: `Common category for ${context}`
                    })}
                  >
                    <span className="mr-1">{config.icon}</span>
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            <div className="flex items-center justify-center gap-1">
              <Brain className="w-3 h-3" />
              <span>Powered by AI • Click to apply suggestions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IssueCategory, CATEGORY_CONFIG, SmartSuggestion } from '@/types/civic';
import { Sparkles, Check, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SmartSuggestionChipProps {
  suggestion: SmartSuggestion;
  onAccept: (category: IssueCategory) => void;
  onReject: () => void;
  className?: string;
}

export const SmartSuggestionChip: React.FC<SmartSuggestionChipProps> = ({
  suggestion,
  onAccept,
  onReject,
  className
}) => {
  const categoryConfig = CATEGORY_CONFIG[suggestion.category];
  const confidenceText = `${Math.round(suggestion.confidence * 100)}% confidence`;

  return (
    <Card className={cn(
      'glass-card border-royal/30 p-4 animate-scale-in bg-gradient-to-r from-royal/5 to-powder/10',
      className
    )}>
      <div className="flex items-center gap-3">
        {/* AI Icon */}
        <div className="bg-royal/10 rounded-full p-2 animate-civic-pulse">
          <Sparkles className="w-4 h-4 text-royal" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{categoryConfig.icon}</span>
            <span className="font-semibold text-royal">
              Looks like a {categoryConfig.label} Issue
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">Powered by AI</p>
                    <p className="text-sm text-muted-foreground">{confidenceText}</p>
                    <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-royal/10 text-royal border-royal/20 text-xs">
              AI Suggested
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              {confidenceText}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onAccept(suggestion.category)}
            size="sm"
            className="bg-royal hover:bg-royal/90 text-white rounded-xl px-4 py-2 h-8 font-medium"
          >
            <Check className="w-3 h-3 mr-1" />
            Fill it
          </Button>
          
          <Button
            onClick={onReject}
            variant="outline"
            size="sm"
            className="border-powder hover:bg-powder/20 text-royal rounded-xl px-3 py-2 h-8"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
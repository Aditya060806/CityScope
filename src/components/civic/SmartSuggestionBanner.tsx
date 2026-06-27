import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmartSuggestion, CATEGORY_CONFIG } from '@/types/civic';
import { Sparkles, Check, X } from 'lucide-react';

interface SmartSuggestionBannerProps {
  suggestion: SmartSuggestion;
  onAccept: () => void;
  onReject: () => void;
  isVisible: boolean;
}

export const SmartSuggestionBanner: React.FC<SmartSuggestionBannerProps> = ({
  suggestion,
  onAccept,
  onReject,
  isVisible
}) => {
  if (!isVisible) return null;

  const categoryConfig = CATEGORY_CONFIG[suggestion.category];

  return (
    <Card className={`
      bg-bone border-powder/30 shadow-civic animate-slide-up
      transition-all duration-300 hover:shadow-lg
    `}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-royal/10 rounded-full p-2">
            <Sparkles className="w-4 h-4 text-royal" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryConfig.icon}</span>
              <span className="font-semibold text-royal">
                Looks like a {categoryConfig.label} issue
              </span>
              <Badge variant="outline" className="text-xs bg-royal/5">
                {Math.round(suggestion.confidence * 100)}% confident
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {suggestion.reason}
            </p>
            
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={onAccept}
                size="sm"
                className="bg-royal hover:bg-royal/90 text-white rounded-xl"
              >
                <Check className="w-4 h-4 mr-1" />
                Auto-fill this category
              </Button>
              
              <Button
                onClick={onReject}
                variant="outline"
                size="sm"
                className="border-powder/30 hover:bg-powder/20 rounded-xl"
              >
                <X className="w-4 h-4 mr-1" />
                No thanks
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-powder/20">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by visual AI — just a helpful guess 😊
          </p>
        </div>
      </div>
    </Card>
  );
};
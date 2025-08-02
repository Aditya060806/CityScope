import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ConfettiCelebration } from './ConfettiCelebration';
import { CheckCircle, Sparkles, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitToastProps {
  show: boolean;
  onComplete: () => void;
  issueTitle?: string;
}

export const SubmitToast: React.FC<SubmitToastProps> = ({
  show,
  onComplete,
  issueTitle = "Civic Issue"
}) => {
  const [stage, setStage] = useState<'submitting' | 'success' | 'pinDrop'>('submitting');

  useEffect(() => {
    if (show) {
      // Simulate submission stages
      const timer1 = setTimeout(() => setStage('success'), 1000);
      const timer2 = setTimeout(() => setStage('pinDrop'), 2000);
      const timer3 = setTimeout(() => onComplete(), 4000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <>
      {/* Confetti Animation */}
      {stage === 'success' && (
        <ConfettiCelebration 
          show={true} 
          duration={2000}
        />
      )}

      {/* Toast Notification */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
        <Card className={cn(
          'glass-enhanced p-4 max-w-sm transition-all duration-500',
          stage === 'success' && 'scale-105 shadow-glow'
        )}>
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={cn(
              'rounded-full p-2 transition-all duration-500',
              stage === 'submitting' && 'bg-royal/10',
              stage === 'success' && 'bg-green-100',
              stage === 'pinDrop' && 'bg-royal/10'
            )}>
              {stage === 'submitting' && (
                <div className="w-5 h-5 border-2 border-royal border-t-transparent rounded-full animate-spin" />
              )}
              {stage === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {stage === 'pinDrop' && (
                <MapPin className="w-5 h-5 text-royal animate-bounce" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              {stage === 'submitting' && (
                <div>
                  <h4 className="font-semibold text-royal">Submitting Report...</h4>
                  <p className="text-sm text-muted-foreground">Processing your civic report</p>
                </div>
              )}
              
              {stage === 'success' && (
                <div>
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Report Submitted!
                  </h4>
                  <p className="text-sm text-green-700">Great job helping your community! 🎉</p>
                </div>
              )}
              
              {stage === 'pinDrop' && (
                <div>
                  <h4 className="font-semibold text-royal">Added to Map</h4>
                  <p className="text-sm text-muted-foreground">"{issueTitle}" is now visible to authorities</p>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex flex-col gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full transition-all duration-500',
                stage !== 'submitting' ? 'bg-green-500' : 'bg-royal animate-pulse'
              )} />
              <div className={cn(
                'w-2 h-2 rounded-full transition-all duration-500',
                stage === 'pinDrop' ? 'bg-royal' : 'bg-muted'
              )} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 bg-muted/30 rounded-full h-1 overflow-hidden">
            <div 
              className={cn(
                'h-full transition-all duration-1000 ease-out',
                stage === 'submitting' && 'w-1/3 bg-royal',
                stage === 'success' && 'w-2/3 bg-green-500',
                stage === 'pinDrop' && 'w-full bg-royal'
              )}
            />
          </div>
        </Card>
      </div>
    </>
  );
};
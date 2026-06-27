import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  MapPin,
  FileText,
  Gift,
  BarChart3,
  User,
  Home,
  SkipForward,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TutorialOverlay } from './TutorialOverlay';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  targetSelector?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform
  page?: string; // Page where this step should be shown
}

interface TutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

export const Tutorial: React.FC<TutorialProps> = ({ 
  steps, 
  onComplete, 
  onSkip, 
  isOpen 
}) => {
  // All hooks must be called before any conditional returns
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const stepRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Update animation key when step changes
  useEffect(() => {
    if (isOpen) {
      setAnimationKey(prev => prev + 1);
    }
  }, [currentStep, isOpen]);

  // Find and highlight target element
  useEffect(() => {
    if (!isOpen || !currentStepData?.targetSelector) {
      setTargetElement(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(currentStepData.targetSelector!) as HTMLElement;
      if (element) {
        setTargetElement(element);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Retry after a short delay if element not found
        setTimeout(findElement, 100);
      }
    };

    findElement();
  }, [currentStep, isOpen, currentStepData?.targetSelector]);

  // Execute step action if provided
  useEffect(() => {
    if (!isOpen || !currentStepData?.action) return;
    
    // Small delay to ensure UI is ready
    const timer = setTimeout(() => {
      currentStepData.action?.();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentStep, currentStepData?.action, isOpen]);

  // Early return after all hooks
  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <>
      {/* Overlay with highlight */}
      <TutorialOverlay targetElement={targetElement} />

      {/* Tutorial Card */}
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <div 
          ref={stepRef}
          key={animationKey}
          className={cn(
            "absolute transition-all duration-500 ease-out",
            "animate-in fade-in slide-in-from-bottom-4 zoom-in-95",
            targetElement 
              ? getPositionClass(currentStepData?.position || 'bottom', targetElement)
              : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
          style={targetElement ? getPositionStyle(currentStepData?.position || 'bottom', targetElement) : {}}
        >
          <Card className="w-[85vw] max-w-sm shadow-2xl border border-royal/20 pointer-events-auto bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden">
            {/* Elegant gradient header */}
            <div className="relative bg-gradient-to-br from-royal via-royal/90 to-royal/80 p-4 overflow-hidden">
              {/* Subtle pattern overlay */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              ></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-white/30">
                    {currentStepData?.icon ? (
                      <currentStepData.icon className="w-4 h-4 text-white" />
                    ) : (
                      <Zap className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-white leading-tight">
                      {currentStepData?.title || 'Welcome!'}
                    </CardTitle>
                    <div className="text-xs text-white/90 mt-0.5 font-semibold">
                      {currentStep + 1} / {steps.length}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-7 w-7 p-0 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              
              {/* Slim Progress Bar */}
              <div className="mt-3">
                <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <p className="text-sm text-gray-900 leading-relaxed mb-4 font-semibold">
                {currentStepData?.description}
              </p>

              {/* Compact Navigation Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="h-8 px-3 text-xs border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="flex-1 h-8 bg-gradient-to-r from-royal to-royal/90 hover:from-royal/90 hover:to-royal/80 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={onComplete}
                    size="sm"
                    className="flex-1 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Start
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Skip tutorial"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

// Helper function to get position class
function getPositionClass(
  position: 'top' | 'bottom' | 'left' | 'right' | 'center',
  element: HTMLElement
): string {
  // Always use fixed positioning
  return 'fixed';
}

// Helper function to get position style
function getPositionStyle(
  position: 'top' | 'bottom' | 'left' | 'right' | 'center',
  element: HTMLElement
): React.CSSProperties {
  const rect = element.getBoundingClientRect();
  const cardWidth = 340; // Smaller, more compact card
  const cardHeight = 200; // Reduced height
  const padding = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Ensure element is in viewport
  const elementTop = Math.max(0, Math.min(rect.top, viewportHeight - rect.height));
  const elementLeft = Math.max(0, Math.min(rect.left, viewportWidth - rect.width));
  const elementBottom = elementTop + rect.height;
  const elementRight = elementLeft + rect.width;
  const elementCenterX = elementLeft + rect.width / 2;
  const elementCenterY = elementTop + rect.height / 2;

  switch (position) {
    case 'top':
      // Position above element, but ensure it's visible
      const topY = elementTop - cardHeight - padding;
      if (topY < 0) {
        // Not enough space above, position below instead
        return {
          top: `${Math.min(elementBottom + padding, viewportHeight - cardHeight - 20)}px`,
          left: `${Math.max(20, Math.min(elementCenterX, viewportWidth - cardWidth / 2 - 20))}px`,
          transform: 'translateX(-50%)',
          maxWidth: '90vw',
        };
      }
      return {
        top: `${Math.max(20, topY)}px`,
        left: `${Math.max(cardWidth / 2 + 20, Math.min(elementCenterX, viewportWidth - cardWidth / 2 - 20))}px`,
        transform: 'translateX(-50%)',
        maxWidth: '90vw',
      };
    case 'bottom':
      // Position below element, but ensure it's visible
      const bottomY = elementBottom + padding;
      if (bottomY + cardHeight > viewportHeight - 20) {
        // Not enough space below, position above instead
        return {
          top: `${Math.max(20, elementTop - cardHeight - padding)}px`,
          left: `${Math.max(20, Math.min(elementCenterX, viewportWidth - cardWidth / 2 - 20))}px`,
          transform: 'translateX(-50%)',
          maxWidth: '90vw',
        };
      }
      return {
        top: `${bottomY}px`,
        left: `${Math.max(cardWidth / 2 + 20, Math.min(elementCenterX, viewportWidth - cardWidth / 2 - 20))}px`,
        transform: 'translateX(-50%)',
        maxWidth: '90vw',
      };
    case 'left':
      // Position to the left, but ensure it's visible
      const leftX = elementLeft - cardWidth - padding;
      if (leftX < 20) {
        // Not enough space on left, position on right instead
        return {
          top: `${Math.max(20, Math.min(elementCenterY - cardHeight / 2, viewportHeight - cardHeight - 20))}px`,
          left: `${Math.min(elementRight + padding, viewportWidth - cardWidth - 20)}px`,
          maxWidth: '90vw',
        };
      }
      return {
        top: `${Math.max(20, Math.min(elementCenterY - cardHeight / 2, viewportHeight - cardHeight - 20))}px`,
        right: `${viewportWidth - leftX}px`,
        maxWidth: '90vw',
      };
    case 'right':
      // Position to the right, but ensure it's visible
      const rightX = elementRight + padding;
      if (rightX + cardWidth > viewportWidth - 20) {
        // Not enough space on right, position on left instead
        return {
          top: `${Math.max(20, Math.min(elementCenterY - cardHeight / 2, viewportHeight - cardHeight - 20))}px`,
          right: `${viewportWidth - elementLeft + padding}px`,
          maxWidth: '90vw',
        };
      }
      return {
        top: `${Math.max(20, Math.min(elementCenterY - cardHeight / 2, viewportHeight - cardHeight - 20))}px`,
        left: `${rightX}px`,
        maxWidth: '90vw',
      };
    case 'center':
    default:
      // Center on screen or relative to element if visible
      if (rect.top < 0 || rect.bottom > viewportHeight || rect.left < 0 || rect.right > viewportWidth) {
        // Element not fully visible, center on screen
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
        };
      }
      // Element is visible, position relative to it
      return {
        top: `${Math.max(20, Math.min(elementCenterY, viewportHeight - cardHeight / 2 - 20))}px`,
        left: `${Math.max(cardWidth / 2 + 20, Math.min(elementCenterX, viewportWidth - cardWidth / 2 - 20))}px`,
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
      };
  }
}

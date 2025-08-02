import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  show,
  onComplete,
  duration = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  const confettiPieces = Array.from({ length: 50 }, (_, i) => (
    <div
      key={i}
      className={cn(
        'absolute w-2 h-2 opacity-90 animate-bounce',
        i % 4 === 0 && 'bg-royal',
        i % 4 === 1 && 'bg-powder',
        i % 4 === 2 && 'bg-bone',
        i % 4 === 3 && 'bg-green-500'
      )}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 2}s`
      }}
    />
  ));

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 animate-fade-in">
        {confettiPieces}
      </div>
      
      {/* Celebration Message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center animate-scale-in">
        <div className="glass-card bg-royal/90 text-white p-6 rounded-3xl shadow-glow border-powder/30">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold mb-1">Rank Up!</h3>
          <p className="text-sm opacity-90">You've unlocked a new civic badge</p>
        </div>
      </div>
    </div>
  );
};
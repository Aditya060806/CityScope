import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
  className?: string;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: {
    x: number;
    y: number;
    rotation: number;
  };
  life: number;
}

const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  trigger,
  onComplete,
  className
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      startCelebration();
    }
  }, [trigger, isActive, startCelebration]);

  const startCelebration = useCallback(() => {
    setIsActive(true);
    const pieces: ConfettiPiece[] = [];
    
    // Create confetti pieces
    for (let i = 0; i < 150; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2,
          rotation: (Math.random() - 0.5) * 10
        },
        life: 1
      });
    }

    setConfetti(pieces);
    animateConfetti();
  }, [animateConfetti]);

  const animateConfetti = useCallback(() => {
    const animationDuration = 3000; // 3 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / animationDuration;

      setConfetti(prev => 
        prev.map(piece => {
          const newY = piece.y + piece.velocity.y;
          const newX = piece.x + piece.velocity.x;
          const newRotation = piece.rotation + piece.velocity.rotation;
          const newLife = piece.life - 0.02;

          // Apply gravity
          piece.velocity.y += 0.1;

          return {
            ...piece,
            x: newX,
            y: newY,
            rotation: newRotation,
            life: newLife
          };
        }).filter(piece => piece.life > 0 && piece.y < window.innerHeight + 100)
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsActive(false);
        setConfetti([]);
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  if (!isActive || confetti.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50", className)}>
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            opacity: piece.life,
            boxShadow: `0 0 ${piece.size}px ${piece.color}`
          }}
        />
      ))}
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfettiAnimationProps {
  isActive: boolean;
  className?: string;
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isActive,
  className
}) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 1000
      }));
      
      setParticles(newParticles);

      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '3s'
          }}
        />
      ))}
    </div>
  );
};

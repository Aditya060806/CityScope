import React from 'react';
import { cn } from '@/lib/utils';

interface ChatbotLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Professional CityScope AI chatbot logo.
 * A modern mark combining a city building silhouette with AI circuit nodes.
 */
export const ChatbotLogo: React.FC<ChatbotLogoProps> = ({ className, size = 'md' }) => {
  const sizeMap = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
    >
      {/* City building silhouette */}
      <rect x="4" y="14" width="6" height="14" rx="1.2" fill="currentColor" opacity="0.9" />
      <rect x="12" y="8" width="8" height="20" rx="1.2" fill="currentColor" />
      <rect x="22" y="11" width="6" height="17" rx="1.2" fill="currentColor" opacity="0.9" />

      {/* Building windows - gives city feel */}
      <rect x="6" y="17" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="6" y="21" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="14" y="11" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="18" y="11" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="14" y="15" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="18" y="15" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="14" y="19" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="18" y="19" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="24" y="14" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />
      <rect x="24" y="18" width="2" height="2" rx="0.4" fill="currentColor" opacity="0.2" />

      {/* AI brain circle - top center, overlapping buildings */}
      <circle cx="16" cy="5" r="4" fill="currentColor" opacity="0.15" />
      <circle cx="16" cy="5" r="2.5" fill="currentColor" opacity="0.35" />

      {/* AI neural dots */}
      <circle cx="16" cy="5" r="1" fill="currentColor" />
      <circle cx="13" cy="3.5" r="0.7" fill="currentColor" opacity="0.7" />
      <circle cx="19" cy="3.5" r="0.7" fill="currentColor" opacity="0.7" />
      <circle cx="14" cy="7" r="0.7" fill="currentColor" opacity="0.7" />
      <circle cx="18" cy="7" r="0.7" fill="currentColor" opacity="0.7" />

      {/* Neural connection lines */}
      <line x1="16" y1="5" x2="13.3" y2="3.7" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <line x1="16" y1="5" x2="18.7" y2="3.7" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <line x1="16" y1="5" x2="14.3" y2="6.8" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <line x1="16" y1="5" x2="17.7" y2="6.8" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />

      {/* Ground line */}
      <rect x="2" y="28" width="28" height="1.5" rx="0.75" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

export default ChatbotLogo;

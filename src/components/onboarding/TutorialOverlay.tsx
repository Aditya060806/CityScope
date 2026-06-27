import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TutorialOverlayProps {
  targetElement: HTMLElement | null;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ targetElement }) => {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetElement) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const rect = targetElement.getBoundingClientRect();
      setHighlightRect(rect);
    };

    updateHighlight();

    // Update on scroll and resize
    window.addEventListener('scroll', updateHighlight, true);
    window.addEventListener('resize', updateHighlight);

    // Watch for element changes
    const observer = new MutationObserver(updateHighlight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      window.removeEventListener('scroll', updateHighlight, true);
      window.removeEventListener('resize', updateHighlight);
      observer.disconnect();
    };
  }, [targetElement]);

  if (!targetElement || !highlightRect) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] pointer-events-none transition-opacity duration-300" />
    );
  }

  const { top, left, width, height } = highlightRect;
  const padding = 6; // Tighter padding for more elegant look

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Elegant dark overlay with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" />
      
      {/* Highlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tutorial-mask">
            <rect width="100%" height="100%" fill="black" />
            <rect
              x={left - padding}
              y={top - padding}
              width={width + padding * 2}
              height={height + padding * 2}
              fill="white"
              rx="8"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* Elegant highlight border with smooth glow */}
      <div
        className="absolute border border-royal rounded-xl transition-all duration-300"
        style={{
          top: `${top - padding}px`,
          left: `${left - padding}px`,
          width: `${width + padding * 2}px`,
          height: `${height + padding * 2}px`,
          boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.15), 0 0 16px rgba(30, 64, 175, 0.3), inset 0 0 20px rgba(30, 64, 175, 0.1)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      />

      {/* Elegant cursor pointer indicator */}
      <div
        className="absolute transition-all duration-300"
        style={{
          top: `${top - 36}px`,
          left: `${left + width / 2}px`,
          transform: 'translateX(-50%)',
          animation: 'float-smooth 2s ease-in-out infinite',
        }}
      >
        <div className="w-7 h-7 bg-gradient-to-br from-royal to-royal/80 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.536 8.382l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

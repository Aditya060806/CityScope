import React from 'react';

// Accessibility wrapper component
interface AccessibilityWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`accessibility-enhanced ${className}`}>
      {children}
    </div>
  );
};

// High contrast mode component
interface HighContrastModeProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const HighContrastMode: React.FC<HighContrastModeProps> = ({ 
  children, 
  enabled = false 
}) => {
  React.useEffect(() => {
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    return () => {
      document.body.classList.remove('high-contrast');
    };
  }, [enabled]);
  
  return <>{children}</>;
};

// Skip link component
interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    target?.focus();
    target?.scrollIntoView();
  };
  
  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
    >
      {children}
    </a>
  );
};
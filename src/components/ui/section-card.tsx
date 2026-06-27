import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon,
  actions,
  className,
  contentClassName,
  children,
}) => {
  return (
    <Card className={cn('border-slate-200/80 bg-white/90 shadow-sleek', className)}>
      {(title || description || actions) && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title ? (
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  {icon}
                  {title}
                </CardTitle>
              ) : null}
              {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
};

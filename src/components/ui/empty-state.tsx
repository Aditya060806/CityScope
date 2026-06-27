import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-10 text-center', className)}>
      {icon ? <div className="mb-3 text-slate-300">{icon}</div> : null}
      <h3 className="text-lg font-bold text-slate-700">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};

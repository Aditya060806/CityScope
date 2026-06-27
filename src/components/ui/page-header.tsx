import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  iconShellClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
  iconShellClassName,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal', iconShellClassName)}>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className={cn('truncate text-2xl font-bold text-slate-900 sm:text-3xl', titleClassName)}>{title}</h1>
          {description ? <p className={cn('mt-1 text-sm text-slate-600', descriptionClassName)}>{description}</p> : null}
        </div>
      </div>

      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </div>
  );
};

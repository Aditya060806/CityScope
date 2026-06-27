import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // Custom props for our design system
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', size = 'md', ...props }, ref) => {
    const variantStyles = {
      default: 'border-slate-200 focus:border-royal focus:ring-royal/15',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
      success: 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20',
    };

    const sizeStyles = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-3.5 text-sm',
      lg: 'h-12 px-4 text-base',
    };

    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-xl bg-white py-2 font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 transition-all duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
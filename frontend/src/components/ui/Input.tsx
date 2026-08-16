import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-sm font-medium text-tg-text">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border border-tg-hint/30 bg-tg-bg px-3 py-2 text-sm text-tg-text file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-tg-hint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tg-button disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Textarea = forwardRef(({ 
  className, 
  error,
  ...props 
}, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full rounded-lg border border-border bg-background px-4 py-3 text-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-200 resize-y',
        error && 'border-error focus:ring-error',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;

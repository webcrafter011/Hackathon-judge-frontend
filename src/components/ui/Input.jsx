import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ 
  className, 
  type = 'text', 
  error,
  icon: Icon,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        style={Icon ? { paddingLeft: '2.5rem' } : undefined}
        className={cn(
          'flex h-11 w-full rounded-lg border border-border bg-background py-2 px-4 text-sm',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-100',
          error && 'border-error focus:ring-error',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

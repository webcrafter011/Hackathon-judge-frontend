import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({ 
  className, 
  error,
  children,
  placeholder,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-11 w-full appearance-none rounded-lg border border-border bg-background px-4 py-2 pr-10 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          error && 'border-error focus:ring-error',
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown 
        size={16} 
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
      />
    </div>
  );
});

Select.displayName = 'Select';

export default Select;

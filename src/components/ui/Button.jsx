import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  primary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm',
  secondary: 'bg-muted text-foreground hover:bg-border',
  outline: 'border border-border bg-background hover:bg-muted hover:text-foreground',
  ghost: 'hover:bg-muted hover:text-foreground',
  link: 'text-secondary underline-offset-4 hover:underline',
  danger: 'bg-error text-white hover:bg-error/90',
};

const buttonSizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-base',
  icon: 'h-10 w-10',
};

const Button = forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  disabled,
  children,
  ...props 
}, ref) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-[0.98]',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

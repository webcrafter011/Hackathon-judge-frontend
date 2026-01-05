import { cn } from '../../lib/utils';

function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
    outline: 'border border-border text-foreground bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;

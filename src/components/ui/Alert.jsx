import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const alertVariants = {
  default: 'bg-muted text-foreground',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
};

const alertIcons = {
  default: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
};

function Alert({ 
  className, 
  variant = 'default', 
  title,
  children, 
  ...props 
}) {
  const Icon = alertIcons[variant];
  
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4',
        alertVariants[variant],
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          {title && (
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Alert;

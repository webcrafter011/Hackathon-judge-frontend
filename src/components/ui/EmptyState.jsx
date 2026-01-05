import { cn } from '../../lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

function EmptyState({ 
  icon: Icon = AlertCircle,
  title = 'No data found',
  description,
  action,
  actionLabel = 'Take action',
  className 
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function ErrorState({ 
  title = 'Something went wrong',
  description = 'An error occurred while loading data.',
  onRetry,
  className 
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-error" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw size={16} />
          Try Again
        </Button>
      )}
    </div>
  );
}

export { EmptyState, ErrorState };

import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-secondary',
        sizes[size],
        className
      )} 
    />
  );
}

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export { Spinner, LoadingScreen };
